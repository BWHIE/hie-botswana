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
   * Extract patient identifier from translated ADT bundle (Omang, BDRS, or Immigration)
   * @param bundle Translated FHIR bundle
   * @returns Object with identifier value and type, or null if not found
   */
  private extractPatientIdentifierFromBundle(bundle: R4.IBundle): { value: string; type: string; system: string } | null {
    try {
      const patientEntry = bundle.entry?.find(entry => 
        entry.resource?.resourceType === 'Patient'
      );
      
      if (patientEntry?.resource) {
        const patient = patientEntry.resource as R4.IPatient;
        
        // Look for Omang identifier (SS - Social Security) - priority 1
        const omangIdentifier = patient.identifier?.find(
          ({ system }) => system === config.get('bwConfig:omangSystemUrl')
        );
        
        if (omangIdentifier?.value) {
          return {
            value: omangIdentifier.value,
            type: 'omang',
            system: config.get('bwConfig:omangSystemUrl')
          };
        }
        
        // Look for BDRS identifier (Birth Certificate) - priority 2
        const bcnIdentifier = patient.identifier?.find(
          ({ system }) => system === config.get('bwConfig:bdrsSystemUrl')
        );
        
        if (bcnIdentifier?.value) {
          return {
            value: bcnIdentifier.value,
            type: 'bcn',
            system: config.get('bwConfig:bdrsSystemUrl')
          };
        }
        
        // Look for Immigration identifier (Passport) - priority 3
        const ppnIdentifier = patient.identifier?.find(
          ({ system }) => system === config.get('bwConfig:immigrationSystemUrl')
        );
        
        if (ppnIdentifier?.value) {
          return {
            value: ppnIdentifier.value,
            type: 'ppn',
            system: config.get('bwConfig:immigrationSystemUrl')
          };
        }
      }
      return null;
    } catch (error) {
      this.logger.error('Error extracting patient identifier from bundle:', error);
      return null;
    }
  }

  /**
   * Extract message timestamp from translated ADT bundle
   * @param bundle Translated FHIR bundle
   * @returns Message timestamp or null if not found
   */
  private extractMessageTimestampFromBundle(bundle: R4.IBundle): Date | null {
    try {
      // Look for Task resource which should have the message timestamp
      const taskEntry = bundle.entry?.find(entry => 
        entry.resource?.resourceType === 'Task'
      );
      
      if (taskEntry?.resource) {
        const task = taskEntry.resource as R4.ITask;
        // Use task authoredOn or lastUpdated
        if (task.authoredOn) {
          return new Date(task.authoredOn);
        } else if (task.meta?.lastUpdated) {
          return new Date(task.meta.lastUpdated);
        }
      }
      
      // Fallback: use current time if no timestamp found
      return new Date();
    } catch (error) {
      this.logger.error('Error extracting message timestamp from bundle:', error);
      return new Date(); // Fallback to current time
    }
  }

  /**
   * Find task by patient identifier and timestamp (simplified approach)
   * @param patientIdentifier Patient identifier value
   * @param identifierSystem Patient identifier system URL
   * @param messageTime Message timestamp
   * @returns Task ID or null if not found
   */
  private async findTaskByAssociation(
    patientIdentifier: string,
    identifierSystem: string,
    messageTime: Date
  ): Promise<string | null> {
    try {
      this.logger.log(`=== Finding Task by Association ===`);
      this.logger.log(`Patient Identifier: ${patientIdentifier}`);
      this.logger.log(`Identifier System: ${identifierSystem}`);
      this.logger.log(`Message Time: ${messageTime.toISOString()}`);

      // Calculate time window (30 minutes before and after message time)
      const timeWindow = 30 * 60 * 1000; // 30 minutes in milliseconds
      const startTime = new Date(messageTime.getTime() - timeWindow);
      const endTime = new Date(messageTime.getTime() + timeWindow);

      this.logger.log(`Searching tasks between: ${startTime.toISOString()} and ${endTime.toISOString()}`);

      // Query for tasks by patient identifier using _revinclude approach (exact match to working code)
      let potentialPatientTasks = await (this.fhirService as any).getTasksByPatientIdentifier(patientIdentifier, identifierSystem, startTime, endTime);
      
      this.logger.log(`Found ${potentialPatientTasks.entry?.length || 0} tasks for patient identifier in time window`);

      // If no tasks found with time window, try without time constraint
      if (!potentialPatientTasks.entry || potentialPatientTasks.entry.length === 0) {
        this.logger.log('No tasks found with time window, trying without time constraint');
        potentialPatientTasks = await (this.fhirService as any).getTasksByPatientIdentifier(patientIdentifier, identifierSystem, new Date(0), new Date());
        this.logger.log(`Found ${potentialPatientTasks.entry?.length || 0} total tasks for patient identifier`);
      }

      if (potentialPatientTasks && potentialPatientTasks.entry) {
        // Get all Tasks with `received` status, which indicates the patient ADT has been sent to IPMS
        const patientTasks = potentialPatientTasks.entry
          .filter(
            e =>
              e.resource &&
              e.resource.resourceType == 'Task' &&
              e.resource.status == 'received',
          )
          .sort((a, b) => {
            if (a.resource && b.resource) {
              const at = a.resource as R4.ITask;
              const bt = b.resource as R4.ITask;

              // Primary sort: by lastUpdated (most recent first) - more reliable field
              const aLastUpdated = new Date(at.meta?.lastUpdated || 0).getTime();
              const bLastUpdated = new Date(bt.meta?.lastUpdated || 0).getTime();
              
              if (bLastUpdated !== aLastUpdated) {
                return bLastUpdated - aLastUpdated;
              }
              
              // Secondary sort: by authoredOn (most recent first) - fallback if available
              const aAuthoredOn = new Date(at.authoredOn || 0).getTime();
              const bAuthoredOn = new Date(bt.authoredOn || 0).getTime();
              
              return bAuthoredOn - aAuthoredOn;
            }
            return 0;
          });

        this.logger.log(`Found ${patientTasks.length} tasks with 'received' status`);

        // For now, if multiple tasks exist, grab the most recent one and log a warning
        if (patientTasks.length > 1) {
          this.logger.warn(
            `More than one task found for patient with identifier ${patientIdentifier}! Processing most recent.`,
          );
        }

        if (patientTasks.length > 0) {
          const targetTask = patientTasks[0].resource;

          if (targetTask) {
            // Validate that the selected task is within the expected time window
            const taskLastUpdated = new Date(targetTask.meta?.lastUpdated || 0);
            const isWithinTimeWindow = taskLastUpdated >= startTime && taskLastUpdated <= endTime;
            
            // Log details about the selected task
            this.logger.log(`=== Selected Task Details ===`);
            this.logger.log(`Task ID: ${targetTask.id}`);
            this.logger.log(`Status: ${targetTask.status}`);
            this.logger.log(`Last Updated: ${targetTask.meta?.lastUpdated} (Primary sort field)`);
            this.logger.log(`Authored On: ${targetTask.authoredOn} (Fallback sort field)`);
            this.logger.log(`Within Time Window: ${isWithinTimeWindow}`);
            this.logger.log(`Time Window: ${startTime.toISOString()} to ${endTime.toISOString()}`);
            this.logger.log(`============================`);
            
            return targetTask.id;
          }
        }
      } else {
        this.logger.error(
          'Could not find any patient tasks for patient with identifier ' + patientIdentifier + '!',
        );
      }

      this.logger.warn('No tasks found for patient identifier in time window');
      return null;
    } catch (error) {
      this.logger.error('Error finding task by association:', error);
      return null;
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

      registrationBundle.entry?.forEach((entry, index) => {
        this.logger.log(`Entry ${index}: ${entry.resource?.resourceType}`);
        if (entry.resource?.resourceType === 'Patient') {
          const patient = entry.resource as R4.IPatient;
          this.logger.log(`Patient identifiers: ${JSON.stringify(patient.identifier)}`);
        }
        if (entry.resource?.resourceType === 'Location') {
          const location = entry.resource as R4.ILocation;
          this.logger.log(`Location identifiers: ${JSON.stringify(location.identifier)}`);
        }
      });

      // Extract association data from translated bundle
      const patientIdentifier = this.extractPatientIdentifierFromBundle(registrationBundle);
      const messageTime = this.extractMessageTimestampFromBundle(registrationBundle);

      if (!patientIdentifier) {
        throw new InternalServerErrorException('Unable to extract patient identifier from ADT bundle - matching supported only on Omang, birth certificate number, or passport number');
      }

      if (!messageTime) {
        throw new InternalServerErrorException('Unable to extract message timestamp from ADT bundle');
      }

      // Find task using simplified approach (identifier + timestamp)
      const taskId = await this.findTaskByAssociation(patientIdentifier.value, patientIdentifier.system, messageTime);

      if (!taskId) {
        throw new InternalServerErrorException(
          `Unable to find associated task for patient identifier: ${patientIdentifier.value}`
        );
      }

      this.logger.log(`Found associated task ID: ${taskId}`);

      // Get patient from registration Bundle///
      const ipmsPatientEntry = registrationBundle.entry!.find((entry) => {
        return entry.resource && entry.resource.resourceType == 'Patient';
      });

      if (ipmsPatientEntry && ipmsPatientEntry.resource) {
        const ipmsPatient = <R4.IPatient>ipmsPatientEntry.resource;

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
            // task.output.push({
            //   type: { text: 'DiagnosticReport' },
            //   valueReference: {
            //     reference: 'DiagnosticReport/' + entry.resource.id,
            //   },
            // });
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
