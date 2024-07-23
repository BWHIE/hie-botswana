import { R4 } from '@ahryman40k/ts-fhir-types';
import {
  Bundle_RequestMethodKind,
  BundleTypeKind,
  IBundle,
  IDiagnosticReport,
  ILocation,
  IObservation,
  IPatient,
  ITask,
  TaskStatusKind,
} from '@ahryman40k/ts-fhir-types/lib/R4';
import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
import { AxiosRequestConfig } from 'axios';
import { FhirService } from 'src/common/services/fhir.service';

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

      const targetIp = config.get('bwConfig:mllp:targetIp');
      const targetPort = config.get('bwConfig:mllp:targetAdtPort');

      const adtResult: string = <string>(
        await this.mllpService.send(adtMessage, targetIp, targetPort)
      );

      if (adtResult.includes && adtResult.includes('AA')) {
        labBundle = setTaskStatus(labBundle, R4.TaskStatusKind._received);
      }
    } else {
      this.logger.log('Order not ready for IPMS.');
    }
    return labBundle;
  }

  async sendOrmToIpms(bundles: any): Promise<R4.IBundle> {
    const srBundle: R4.IBundle = { resourceType: 'Bundle', entry: [] };
    let labBundle = bundles.taskBundle.data;
    const patient = bundles.patient;

    try {
      // Replace PIMS/OpenMRS Patient Resource with one From IPMS Lab System
      const pindex = labBundle.entry!.findIndex((entry: any) => {
        return entry.resource && entry.resource.resourceType == 'Patient';
      });

      labBundle.entry[pindex].resource = patient;

      const options: AxiosRequestConfig = {
        timeout: config.get('bwConfig:requestTimeout'),
        params: {},
      };

      const sendBundle = { ...labBundle };
      sendBundle.entry = [];
      srBundle.entry = [];

      // Compile sendBundle.entry from labBundle
      // TODO: Outline Logic for mapping between Panels and sending multiple tests
      for (const entry of labBundle.entry) {
        // Isolate and process ServiceRequests
        if (entry.resource && entry.resource.resourceType == 'ServiceRequest') {
          // For PIMS - check if service request is profile-level and get child service requests:
          options.params = {
            'based-on': entry.resource.id,
          };
          // TODO: Retry logic
          const { data: fetchedBundle } =
            await this.httpService.axiosRef.get<R4.IBundle>(
              `${config.get('fhirServer:baseURL')}/ServiceRequest`,
              options,
            );

          if (fetchedBundle && fetchedBundle.entry && srBundle.entry) {
            // Add child ServiceRequests if any exist
            srBundle.entry = srBundle.entry.concat(fetchedBundle.entry);
          } else if (
            (!fetchedBundle ||
              !(fetchedBundle.entry && fetchedBundle.entry.length > 0)) &&
            srBundle.entry
          ) {
            // If no child ServiceRequests, add this one if it has a code entry
            if (
              entry.resource.code &&
              entry.resource.code.coding &&
              entry.resource.code.coding.length > 0
            ) {
              srBundle.entry.push(entry);
            }
          }
        } else {
          // Copy over everything else
          sendBundle.entry.push(entry);
        }
      }

      // Send one ORM for each ServiceRequest
      // TODO: FIGURE OUT MANAGEMENT OF PANELS/PROFILES
      for (const sr of srBundle.entry) {
        // Send one ORM for each ServiceRequest
        const outBundle: R4.IBundle = { ...sendBundle };

        outBundle.entry.push(sr);

        //@TODO Temporary workaround to add location resource to bundle to avoid FHIR to HL7 conversion error when sending an ORM!
        const task = <ITask>(
          outBundle.entry.find(
            (e: any) => e.resource && e.resource.resourceType == 'Task',
          )!.resource!
        );
        const locationReference = task.requester || null;
        if (locationReference) {
          if (locationReference.reference.split('/')[0] == 'Organization') {
            const { data: fetchedBundle } =
              await this.httpService.axiosRef.get<R4.IBundle>(
                `${config.get('fhirServer:baseURL')}/Location?organization=${locationReference.reference}`,
              );
            const locationResource = {
              fullUrl: fetchedBundle.entry[0].fullUrl,
              resource: <ILocation>fetchedBundle.entry[0].resource,
            };

            this.logger.log(
              `Retrieved Location resource : ${JSON.stringify(locationResource)}`,
            );
            outBundle.entry.push(locationResource);
          }
        }

        // const translatedBundle = await this.labService.translateToTransactionBundle(outBundle);

        const ormMessage = await this.hl7Service.getFhirTranslationWithRetry(
          outBundle,
          config.get('bwConfig:toIpmsOrmTemplate'),
        );

        const targetIp = config.get('bwConfig:mllp:targetIp');
        const targetPort = config.get('bwConfig:mllp:targetOrmPort');

        this.logger.log('Sending ORM message to IPMS!');

        this.logger.log(`orm:\n${ormMessage}\n`);

        if (ormMessage && ormMessage != '') {
          const result: any = await this.mllpService.send(
            ormMessage,
            targetIp,
            targetPort,
          );
          if (result.includes('AA')) {
            labBundle = setTaskStatus(labBundle, R4.TaskStatusKind._accepted);
          }
          this.logger.log(`*result:\n${result}\n`);
        }
      }
    } catch (e) {
      this.logger.error(`Could not send ORM message to IPMS!\n${e}`);
      throw new InternalServerErrorException(
        `Could not send ORM message to IPMS!\n${e}`,
      );
    }
    return labBundle;
  }

  /**
   * Handles ADT (Admission, Discharge, Transfer) messages received from IPMS (Integrated Patient Management System).
   *
   * This method needs to be able to match the patient coming back to the patient going in.
   *
   * @param registrationBundle - The registration bundle containing the patient information.
   * @returns A Promise that resolves to the registration bundle.
   */
  async handleAdtFromIpms(adtMessage: string): Promise<any> {
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
      let patient: R4.IPatient,
        omang: string,
        ppn: string,
        bcn: string,
        identifierParam: string;

      const patEntry = registrationBundle.entry!.find((entry) => {
        return entry.resource && entry.resource.resourceType == 'Patient';
      });

      if (patEntry && patEntry.resource) {
        patient = <R4.IPatient>patEntry.resource;

        // Find patient identifiers, if they exist
        const omangEntry = patient.identifier?.find(
          (i) => i.system && i.system == config.get('bwConfig:omangSystemUrl'),
        );

        const ppnEntry = patient.identifier?.find(
          (i) =>
            i.system && i.system == config.get('bwConfig:immigrationSystemUrl'),
        );

        const bcnEntry = patient.identifier?.find(
          (i) => i.system && i.system == config.get('bwConfig:bdrsSystemUrl'),
        );

        if (omangEntry && omangEntry.value) {
          omang = omangEntry.value;
          identifierParam = `${config.get('bwConfig:omangSystemUrl')}|${omang}`;
        } else if (bcnEntry && bcnEntry.value) {
          bcn = bcnEntry.value;
          identifierParam = `${config.get('bwConfig:bdrsSystemUrl')}|${bcn}`;
        } else if (ppnEntry && ppnEntry.value) {
          ppn = ppnEntry.value;
          identifierParam = `${config.get('bwConfig:immigrationSystemUrl')}|${ppn}`;
        } else {
          const errorMessage =
            'Patient missing a required identifier - matching supported only on Omang, birth certificate number, or passport number.';

          this.logger.error(errorMessage);

          throw new InternalServerErrorException(errorMessage);
        }

        // Find all patients with these identifiers and grab the related Tasks

        let potentialPatientTasks: R4.IBundle;
        try {
          const { data } = await this.httpService.axiosRef.get<R4.IBundle>(
            `${config.get('fhirServer:baseURL')}/Patient`,
            {
              params: {
                identifier: `${identifierParam}`,
                _revinclude: 'Task:patient',
              },
            },
          );
          potentialPatientTasks = data;
        } catch (e) {
          potentialPatientTasks = { resourceType: 'Bundle' };
          this.logger.error(e);
        }

        if (potentialPatientTasks && potentialPatientTasks.entry) {
          // Get all Tasks with `received` status, which indicates the patient ADT has been sent to IPMS

          // Filter and Sort all resources in entry to have tasks by decending order or creation
          const patientTasks = potentialPatientTasks.entry
            .filter(
              (e) =>
                e.resource &&
                e.resource.resourceType == 'Task' &&
                e.resource.status == TaskStatusKind._received,
            )
            .sort((a, b) => {
              if (a.resource && b.resource) {
                const at = <ITask>a.resource;
                const bt = <ITask>b.resource;

                return (
                  new Date(bt.authoredOn || 0).getTime() -
                  new Date(at.authoredOn || 0).getTime()
                );
              }
              return 0;
            });

          // TODO: Account for multiple task results!

          // For now, if multiple tasks exist, grab the most recent one and log a warning
          if (patientTasks.length > 1) {
            this.logger.warn(
              `More than one task found for patient ${patient.id} with identifier ${identifierParam}! Processing most recent.`,
            );
          }

          if (patientTasks.length > 0) {
            const targetTask = patientTasks[0].resource;

            if (targetTask) {
              // Grab bundle for task:
              const taskBundle: IBundle = await this.httpService.axiosRef.get(
                `${config.get('fhirServer:baseURL')}/Task`,
                {
                  params: {
                    _include: '*',
                    _id: targetTask.id,
                  },
                },
              );

              return { patient: patient, taskBundle: taskBundle };
            }
          }
          return { patient: undefined, taskBundle: undefined };
        } else {
          this.logger.error(
            'Could not find any patient tasks for patient with identifier ' +
              identifierParam +
              '!',
          );
          return { patient: undefined, taskBundle: undefined };
        }
      }
    } catch (e) {
      this.logger.error('Could not process ADT!\n' + e);
      throw new InternalServerErrorException('Could not process ADT!\n' + e);
    }
  }

  /**
   * Handles ORU (Observation Result) messages received from IPMS (Integrated Patient Management System).
   */
  async handleOruFromIpms(message: any): Promise<R4.IBundle> {
    let translatedBundle: R4.IBundle = { resourceType: 'Bundle' };
    let resultBundle: R4.IBundle = { resourceType: 'Bundle' };
    let serviceRequestBundle: R4.IBundle = { resourceType: 'Bundle' };

    let taskPatient: IPatient, task: ITask;

    try {
      if (!message) throw new Error('No message provided!');

      if (!message.bundle) message = JSON.parse(message);

      translatedBundle = message.bundle;

      if (translatedBundle && translatedBundle.entry) {
        // Extract Patient, DiagnosticReport, and Observation
        const patient: IPatient = <IPatient>(
          translatedBundle.entry.find(
            (e: any) => e.resource && e.resource.resourceType == 'Patient',
          )!.resource!
        );

        let dr: IDiagnosticReport = <IDiagnosticReport>(
          translatedBundle.entry.find(
            (e: any) =>
              e.resource && e.resource.resourceType == 'DiagnosticReport',
          )!.resource!
        );

        const obs: IObservation = <IObservation>(
          translatedBundle.entry.find(
            (e: any) => e.resource && e.resource.resourceType == 'Observation',
          )!.resource!
        );

        // Enrich DiagnosticReport with Terminology Mappings
        dr = <R4.IDiagnosticReport>(
          await this.terminologyService.translateCoding(dr)
        );

        // Process Patient information
        const { omang, bcn, ppn, patOptions } =
          this.processIpmsPatient(patient);

        /** Matching Approach:
         *  Use provided Lab Order Identifier to link ServiceRequest, Task, and Diagnostic Report together.
         */

        // Extract Lab Order ID from Diagnostic Report
        const labOrderId =
          dr.identifier && dr.identifier.length > 0
            ? dr.identifier.find(
                (i: any) =>
                  i.system == config.get('bwConfig:labOrderSystemUrl'),
              )
            : undefined;
        const labOrderMrn =
          dr.identifier && dr.identifier.length > 0
            ? dr.identifier.find(
                (i: any) => i.system == config.get('bwConfig:mrnSystemUrl'),
              )
            : undefined;

        if (labOrderId && labOrderId.value) {
          const formerOptions: AxiosRequestConfig = {
            timeout: config.get('bwConfig:requestTimeout'),
            params: {},
          };

          /**
         * When an ORU (Observation Result) message is received, the 'Based-on' parameter of the Task resource is never updated.
         * To address this, we need to use the previous Service Request resource. 
         * This is done by retrieving the 'based-on' reference parameter of the Service Request resource 
         * that corresponds to the given 'labOrderId.value'. 
   
         * The following options include parameters to:
         * 1. Retrieve the Task resource that includes the referenced Patient resource ('Task:patient').
         * 2. Retrieve the Task resource that includes the referenced Service Request resource ('Task:based-on').
         * 3. Specify the 'based-on' reference using the provided labOrderId value.
         */

          const previousSr = <R4.IServiceRequest>(
            await this.fhirService.get(
              ResourceType.ServiceRequest,
              formerOptions,
              labOrderId.value,
            )
          );
          const formerLabOrderId =
            previousSr.basedOn[0].reference.split('/')[1];

          const options: AxiosRequestConfig = {
            timeout: config.get('bwConfig:requestTimeout'),
            params: {},
          };

          (options.params['_include'] = 'Task:patient'), 'Task:based-on';
          options.params['based-on'] = formerLabOrderId;

          serviceRequestBundle = await this.fhirService.get(
            ResourceType.Task,
            options,
          );
        }

        if (
          serviceRequestBundle &&
          serviceRequestBundle.entry &&
          serviceRequestBundle.entry.length > 0
        ) {
          // Extract Task and Patient Resources from ServiceRequest Bundle
          taskPatient = <IPatient>(
            serviceRequestBundle.entry.find(
              (e: any) => e.resource && e.resource.resourceType == 'Patient',
            )!.resource!
          );

          task = <ITask>(
            serviceRequestBundle.entry.find(
              (e: any) => e.resource && e.resource.resourceType == 'Task',
            )!.resource!
          );

          /**
           * TODO: Validate Patient Match by Identifier/CR match
           *  taskPatient.identifier == patient.identifier (for omang/brn/ppn) or make sure the two are linked in CR.
           * Retrieve Golden Record from the Client Registry?
           */
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
        obs.subject = { reference: 'Patient/' + taskPatient.id };
        dr.subject = { reference: 'Patient/' + taskPatient.id };

        // Update DR with based-on
        if (!dr.basedOn) dr.basedOn = [];
        if (!task.basedOn) task.basedOn = [];

        dr.basedOn.push({ reference: 'ServiceRequest/' + labOrderId.value });
        task.basedOn.push({ reference: 'DiagnosticReport/' + dr.id });

        // Update Task Resource with the new based-on Value for Service Request
        task.basedOn.push({ reference: 'ServiceRequest/' + labOrderId.value });

        // Generate SendBundle with Task, DiagnosticReport, Patient, and Observation
        const entry = this.createSendBundleEntry(task, dr, obs);

        // TODO: Only send if valid details available
        const sendBundle: R4.IBundle = {
          resourceType: 'Bundle',
          type: BundleTypeKind._transaction,
          entry: entry,
        };

        // Save to SHR
        resultBundle = await this.labService.saveBundle(sendBundle);
      }
    } catch (error: any) {
      this.logger.error(`Could not process ORU!\n${error}`);
      throw new InternalServerErrorException(error.toString());
    }

    return resultBundle;
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
