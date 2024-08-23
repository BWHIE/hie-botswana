import { R4 } from '@ahryman40k/ts-fhir-types';
import {
  BundleTypeKind,
  IDiagnosticReport,
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
    try {
      if (!message) throw new Error('No message provided!');

      if (!message.bundle) message = JSON.parse(message);

      const translatedBundle = message.bundle as R4.IBundle;

      if (
        translatedBundle &&
        Array.isArray(translatedBundle.entry) &&
        translatedBundle.entry.length > 0
      ) {
        // Matching Approach:
        // Use provided Lab Order Identifier to link ServiceRequest, Task, and Diagnostic Report together.
        const anyDiagnosticReport = translatedBundle.entry.find(
          (e) => e.resource && e.resource.resourceType == 'DiagnosticReport',
        )?.resource as IDiagnosticReport;

        if (!anyDiagnosticReport) {
          throw new Error(
            'Unable to find any diagnostic report in ORU response',
          );
        }

        // Extract Lab Order ID from Diagnostic Report
        const labOrderId =
          anyDiagnosticReport.identifier &&
          anyDiagnosticReport.identifier.length > 0
            ? anyDiagnosticReport.identifier.find(
                (i: any) =>
                  i.system == config.get('bwConfig:labOrderSystemUrl'),
              )
            : undefined;

        if (!labOrderId) {
          throw new Error(
            'Unable to find any lab order id in the diagnostic report',
          );
        }

        /**
         * When an ORU (Observation Result) message is received, the 'Based-on' parameter of the Task resource is never updated.
         * To address this, we need to use the previous Service Request resource.
         * This is done by retrieving the 'based-on' reference parameter of the Service Request resource
         * that corresponds to the given 'labOrderId.value'.
         */
        const taskBundle = await this.fhirService.get(ResourceType.Task, {
          timeout: config.get('bwConfig:requestTimeout'),
          params: {
            _include: 'Task:patient',
            'based-on': labOrderId.value,
          },
        });

        // Extract Task and Patient Resources from ServiceRequest Bundle
        const patient = <IPatient>(
          taskBundle.entry.find(
            (e) => e.resource && e.resource.resourceType == 'Patient',
          )!.resource!
        );

        const task = <ITask>(
          taskBundle.entry.find(
            (e) => e.resource && e.resource.resourceType == 'Task',
          )!.resource!
        );

        if (!task || !patient) {
          this.logger.error(
            'Could not find patient / task with Lab Order ORU ' +
              JSON.stringify(labOrderId) +
              '!',
          );
          throw new InternalServerErrorException(
            'Could not find patient / task with Lab Order ORU ' +
              labOrderId +
              '!',
          );
        }

        const diagnosticReports = translatedBundle.entry
          .filter(({ resource }) => {
            return resource.resourceType === 'DiagnosticReport';
          })
          .map((entry) => {
            task.basedOn.push({
              reference: 'DiagnosticReport/' + entry.resource.id,
            });
            task.output.push({
              type: { text: 'DiagnosticReport' },
              valueReference: {
                reference: 'DiagnosticReport/' + entry.resource.id,
              },
            });
            return {
              ...entry,
              resource: {
                ...this.terminologyService.translateCoding(
                  entry.resource as R4.IDiagnosticReport,
                ),
                subject: { reference: 'Patient/' + patient.id },
                basedOn: [
                  {
                    reference: 'ServiceRequest/' + labOrderId.value,
                  },
                ],
              },
            } as R4.IBundle_Entry;
          });

        // Enrich DiagnosticReport with Terminology Mappings
        const observations = translatedBundle.entry
          .filter(({ resource }) => {
            return resource.resourceType === 'Observation';
          })
          .map((entry) => {
            return {
              ...entry,
              resource: {
                ...entry.resource,
                subject: { reference: 'Patient/' + patient.id },
              },
            } as R4.IBundle_Entry;
          });

        task.status = TaskStatusKind._completed;

        const sendBundle: R4.IBundle = {
          resourceType: 'Bundle',
          type: BundleTypeKind._transaction,
          entry: [
            {
              resource: task,
              request: {
                method: R4.Bundle_RequestMethodKind._put,
                url: 'Task/' + task.id,
              },
            },
            ...diagnosticReports,
            ...observations,
          ],
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
}
