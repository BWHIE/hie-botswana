import { R4 } from '@ahryman40k/ts-fhir-types';
import {
  Bundle_RequestMethodKind,
  BundleTypeKind,
  IDiagnosticReport,
  IObservation,
  IPatient,
  ITask,
  TaskStatusKind,
} from '@ahryman40k/ts-fhir-types/lib/R4';
import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { FhirService } from 'src/common/services/fhir.service';
import {
  getTaskStatus,
  ResourceType,
  setTaskStatus,
} from '../../common/utils/fhir';
import config from '../../config';
import { LoggerService } from '../../logger/logger.service';
import { Hl7Service } from './hl7.service';
import { LabWorkflowService } from './lab-workflow.service';
import { MllpService } from './mllp.service';
import { TerminologyService } from './terminology.service';

@Injectable()
export class IpmsService {
  constructor(
    private readonly hl7Service: Hl7Service,
    private readonly mllpService: MllpService,
    private readonly terminologyService: TerminologyService,
    private readonly labService: LabWorkflowService,
    private readonly fhirService: FhirService,
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Sends an ADT message to IPMS.
   * @param labBundle The lab bundle to send.
   * @returns The updated lab bundle.
   */
  async sendAdtToIpms(labBundle: R4.IBundle): Promise<R4.IBundle> {
    const status = getTaskStatus(labBundle);

    if (status && status === R4.TaskStatusKind._requested) {
      this.logger.log('Sending ADT message to IPMS!');

      const adtMessage = await this.hl7Service.getFhirTranslationWithRetry(
        labBundle,
        config.get('bwConfig:toIpmsAdtTemplate'),
      );

      this.logger.log(`adt:\n${adtMessage}`);

      const targetHost = config.get('bwConfig:mllp:targetHost');
      const targetPort = config.get('bwConfig:mllp:targetAdtPort');

      const adtResult: string = <string>(
        await this.mllpService.send(adtMessage, targetHost, targetPort)
      );

      if (adtResult.includes && adtResult.includes('AA')) {
        labBundle = setTaskStatus(labBundle, R4.TaskStatusKind._received);
      }
      return labBundle;
    } else {
      throw new Error('Unsupported Task status');
    }
  }

  async sendOrmToIpms(labBundle: R4.IBundle): Promise<R4.IBundle> {
    try {
      const task = labBundle.entry.find(
        ({ resource }) => resource.resourceType === 'Task',
      )?.resource as R4.ITask;

      // Send one ORM for each ServiceRequest
      // TODO: FIGURE OUT MANAGEMENT OF PANELS/PROFILES
      for (const serviceRequestRef of task.basedOn) {
        const [, serviceRequestId] = serviceRequestRef.reference.split('/');
        // Send one ORM for each ServiceRequest
        const outBundle: R4.IBundle = {
          ...labBundle,
          entry: [
            ...labBundle.entry.filter(
              ({ resource }) => resource.resourceType !== 'ServiceRequest',
            ),
            labBundle.entry.find(
              ({ resource }) =>
                resource.resourceType === 'ServiceRequest' &&
                resource.id === serviceRequestId,
            ),
          ],
        };

        const ormMessage = await this.hl7Service.getFhirTranslationWithRetry(
          outBundle,
          config.get('bwConfig:toIpmsOrmTemplate'),
        );

        const targetHost = config.get('bwConfig:mllp:targetHost');
        const targetPort = config.get('bwConfig:mllp:targetOrmPort');

        this.logger.log('Sending ORM message to IPMS!');

        this.logger.log(`orm:\n${ormMessage}\n`);

        if (ormMessage && ormMessage != '') {
          const result: any = await this.mllpService.send(
            ormMessage,
            targetHost,
            targetPort,
          );
          if (result.includes('AA')) {
            labBundle = setTaskStatus(labBundle, R4.TaskStatusKind._accepted);
          }
          this.logger.log(`*result:\n${result}\n`);
        }
      }

      return labBundle;
    } catch (e) {
      this.logger.error(`Could not send ORM message to IPMS!\n${e}`);
      throw new InternalServerErrorException(
        `Could not send ORM message to IPMS!\n${e}`,
      );
    }
  }

  /**
   * Handles ADT (Admission, Discharge, Transfer) messages received from IPMS (Integrated Patient Management System).
   *
   * This method needs to be able to match the patient coming back to the patient going in.
   *
   * @param registrationBundle - The registration bundle containing the patient information.
   * @returns A Promise that resolves to the registration bundle.
   */
  async handleAdtFromIpms(adtMessage: string) {
    try {
      const registrationBundle: R4.IBundle =
        await this.hl7Service.translateBundle(
          adtMessage,
          'bwConfig:fromIpmsAdtTemplate',
        );

      if (registrationBundle === Hl7Service.errorBundle) {
        throw new Error('Could not translate ADT message!');
      }

      // Get patient from registration Bundle
      const ipmsPatientEntry = registrationBundle.entry!.find((entry) => {
        return entry.resource && entry.resource.resourceType == 'Patient';
      });

      if (ipmsPatientEntry && ipmsPatientEntry.resource) {
        const ipmsPatient = <R4.IPatient>ipmsPatientEntry.resource;

        const taskId = ipmsPatient.identifier.find(({ system }) =>
          system.endsWith('task-id'),
        )?.value;

        if (!taskId) {
          throw new InternalServerErrorException(
            'Unable to find task id in the ADT response',
          );
        }

        // Grab bundle for task:
        const bundle = await this.fhirService.getAllResourcesByTask(taskId);

        const patient = bundle.entry.find(
          ({ resource }) => resource.resourceType === 'Patient',
        )?.resource as R4.IPatient;
        if (!patient) {
          throw new InternalServerErrorException(
            'Unable to find patient in the task bundle',
          );
        }

        // Add MRN Number
        const mrnIdentifier = ipmsPatient.identifier.find(
          ({ system }) => system === config.get('bwConfig:mrnSystemUrl'),
        );
        if (mrnIdentifier) {
          patient.identifier.push(mrnIdentifier);
        } else {
          throw new InternalServerErrorException(
            'Unable to find ipms patient MRN number in the task bundle',
          );
        }

        // Add Account Number
        const accIdentifier = ipmsPatient.identifier.find(
          ({ system }) => system === config.get('bwConfig:accSystemUrl'),
        );
        if (accIdentifier) {
          patient.identifier.push(accIdentifier);
        } else {
          throw new InternalServerErrorException(
            'Unable to find ipms patient Account number in the task bundle',
          );
        }

        return bundle;
      } else {
        throw new InternalServerErrorException(
          'Could not find patient resource in translated ADT!\n' +
            JSON.stringify(registrationBundle),
        );
      }
    } catch (e) {
      this.logger.error('Could not process ADT!\n' + e);
      throw new InternalServerErrorException('Could not process ADT!\n' + e);
    }
  }

  /**
   * Handles ORU (Observation Result) messages received from IPMS (Integrated Patient Management System).
   */
  async handleOruFromIpms(message: any) {
    let translatedBundle: R4.IBundle = { resourceType: 'Bundle' };
    let taskBundle: R4.IBundle = { resourceType: 'Bundle' };

    let taskPatient: IPatient, task: ITask;

    try {
      if (!message) throw new Error('No message provided!');

      if (!message.bundle) message = JSON.parse(message);

      translatedBundle = message.bundle;

      if (translatedBundle && translatedBundle.entry) {
        console.log('?????', JSON.stringify(translatedBundle));

        let diagnosticReport = translatedBundle.entry.find(
          (e) => e.resource && e.resource.resourceType == 'DiagnosticReport',
        )?.resource as IDiagnosticReport;

        const observation = translatedBundle.entry.find(
          (e) => e.resource && e.resource.resourceType == 'Observation',
        )?.resource as IObservation;

        // Enrich DiagnosticReport with Terminology Mappings
        diagnosticReport = <R4.IDiagnosticReport>(
          await this.terminologyService.translateCoding(diagnosticReport)
        );

        /** Matching Approach:
         *  Use provided Lab Order Identifier to link ServiceRequest, Task, and Diagnostic Report together.
         */

        // Extract Lab Order ID from Diagnostic Report
        const labOrderId =
          diagnosticReport.identifier && diagnosticReport.identifier.length > 0
            ? diagnosticReport.identifier.find(
                (i: any) =>
                  i.system == config.get('bwConfig:labOrderSystemUrl'),
              )
            : undefined;

        if (labOrderId && labOrderId.value) {
          /**
           * When an ORU (Observation Result) message is received, the 'Based-on' parameter of the Task resource is never updated.
           * To address this, we need to use the previous Service Request resource.
           * This is done by retrieving the 'based-on' reference parameter of the Service Request resource
           * that corresponds to the given 'labOrderId.value'.
           */

          const options: AxiosRequestConfig = {
            timeout: config.get('bwConfig:requestTimeout'),
            params: {},
          };

          (options.params['_include'] = 'Task:patient'), 'Task:based-on';
          options.params['based-on'] = labOrderId.value;

          taskBundle = await this.fhirService.get(ResourceType.Task, options);
        }

        if (taskBundle && taskBundle.entry && taskBundle.entry.length > 0) {
          // Extract Task and Patient Resources from ServiceRequest Bundle
          taskPatient = <IPatient>(
            taskBundle.entry.find(
              (e: any) => e.resource && e.resource.resourceType == 'Patient',
            )!.resource!
          );

          task = <ITask>(
            taskBundle.entry.find(
              (e: any) => e.resource && e.resource.resourceType == 'Task',
            )!.resource!
          );
        } else {
          this.logger.error(
            'Could not find ServiceRequest with Lab Order ID ' +
              JSON.stringify(labOrderId) +
              '!',
          );
          throw new InternalServerErrorException(
            'Could not find ServiceRequest with Lab Order ID ' +
              labOrderId +
              '!',
          );
        }

        // Update Obs and DR with Patient Reference
        observation.subject = { reference: 'Patient/' + taskPatient.id };
        diagnosticReport.subject = { reference: 'Patient/' + taskPatient.id };

        // Update DR with based-on
        if (!diagnosticReport.basedOn) diagnosticReport.basedOn = [];
        if (!task.basedOn) task.basedOn = [];

        diagnosticReport.basedOn.push({
          reference: 'ServiceRequest/' + labOrderId.value,
        });
        task.basedOn.push({
          reference: 'DiagnosticReport/' + diagnosticReport.id,
        });

        // Generate SendBundle with Task, DiagnosticReport, Patient, and Observation
        const entry = this.createSendBundleEntry(
          task,
          diagnosticReport,
          observation,
        );

        // TODO: Only send if valid details available
        const sendBundle: R4.IBundle = {
          resourceType: 'Bundle',
          type: BundleTypeKind._transaction,
          entry: entry,
        };

        // Save to SHR
        await this.labService.saveBundle(sendBundle);
      } else {
        throw new InternalServerErrorException(
          'No entry in translated ORU bundle',
        );
      }
    } catch (error: any) {
      this.logger.error(`Could not process ORU!\n${error}`);
      throw new InternalServerErrorException(error.toString());
    }
  }

  processIpmsPatient(patient: R4.IPatient): any {
    // TODO: Figure out how IPMS stores bcn and ppn
    let omang, bcn, ppn;

    const omangEntry = patient.identifier?.find(
      (i) => i.system && i.system == config.get('bwConfig:omangSystemUrl'),
    );
    const bcnEntry = patient.identifier?.find(
      (i) => i.system && i.system == config.get('bwConfig:bdrsSystemUrl'),
    );

    const ppnEntry = patient.identifier?.find(
      (i) =>
        i.system && i.system == config.get('bwConfig:immigrationSystemUrl'),
    );

    const identifierQuery = [];

    if (omangEntry) {
      omang = omangEntry.value!;
      identifierQuery.push(`${config.get('bwConfig:omangSystemUrl')}|${omang}`);
    } else {
      omang = '';
    }

    if (bcnEntry) {
      bcn = bcnEntry.value!;
      identifierQuery.push(`${config.get('bwConfig:bdrsSystemUrl')}|${bcn}`);
    } else {
      bcn = '';
    }

    if (ppnEntry) {
      ppn = ppnEntry.value!;
      identifierQuery.push(
        `${config.get('bwConfig:immigrationSystemUrl')}|${ppn}`,
      );
    } else {
      ppn = '';
    }

    const identifierQueryString = identifierQuery.join(',');

    const options: AxiosRequestConfig = {
      timeout: config.get('bwConfig:requestTimeout'),
      params: {},
    };

    options.params = {
      identifier: identifierQueryString,
      _revinclude: ['ServiceRequest:patient', 'Task:patient'],
    };

    return { omang: omang, bcn: bcn, ppn: ppn, options: options };
  }

  createSendBundleEntry(
    task: R4.ITask | undefined,
    dr: R4.IDiagnosticReport | undefined,
    obs: R4.IObservation | undefined,
  ): R4.IBundle_Entry[] {
    const entry = [];
    const output = [];

    if (dr) {
      output.push({
        type: { text: 'DiagnosticReport' },
        valueReference: { reference: 'DiagnosticReport/' + dr.id },
      });

      entry.push({
        resource: dr,
        request: {
          method: Bundle_RequestMethodKind._put,
          url: 'DiagnosticReport/' + dr.id,
        },
      });
    }

    if (obs) {
      entry.push({
        resource: obs,
        request: {
          method: Bundle_RequestMethodKind._put,
          url: 'Observation/' + obs.id,
        },
      });
    }

    if (task) {
      task.status = TaskStatusKind._completed;
      task.output = output;
      entry.push({
        resource: task,
        request: {
          method: Bundle_RequestMethodKind._put,
          url: 'Task/' + task.id,
        },
      });
    }

    return entry;
  }
}
