import { R4 } from '@ahryman40k/ts-fhir-types';
import { BadRequestException, Injectable } from '@nestjs/common';
import { FhirService } from 'src/common/services/fhir.service';
import { LoggerService } from '../../logger/logger.service';
import { topicList } from '../utils/topics';
import { KafkaProducerService } from './kafka-producer.service';

@Injectable()
export class LabWorkflowService {
  constructor(
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly fhirService: FhirService,
    private readonly logger: LoggerService,
  ) {}

  validateBundle(bundle: any): void {
    if (
      !bundle ||
      bundle.resourceType !== 'Bundle' ||
      bundle.type !== 'transaction'
    ) {
      throw new BadRequestException('Invalid FHIR Bundle');
    }

    const resources = {
      Practitioner: 0,
      ServiceRequest: 0,
      Task: 0,
    };

    const resourceMap = new Map<string, any>();

    for (const entry of bundle.entry) {
      const resourceType = entry.resource.resourceType;
      if (!resources.hasOwnProperty(resourceType)) {
        throw new BadRequestException(
          `Unexpected resource type: ${resourceType}`,
        );
      }
      resources[resourceType]++;

      // Ensure that fullUrl and id match
      if (entry.fullUrl !== `urn:uuid:${entry.resource.id}`) {
        throw new BadRequestException(
          `Mismatched fullUrl and id for resource type: ${resourceType}`,
        );
      }

      // Store resource by fullUrl for reference checking later
      resourceMap.set(entry.fullUrl, entry.resource);
    }

    // Validate resource counts
    if (resources.Practitioner !== 1) {
      throw new BadRequestException(
        'Bundle must contain exactly 1 Practitioner resource',
      );
    }
    if (resources.ServiceRequest < 1) {
      throw new BadRequestException(
        'Bundle must contain at least 1 ServiceRequest resource',
      );
    }
    if (resources.Task < 1) {
      throw new BadRequestException(
        'Bundle must contain at least 1 Task resource',
      );
    }

    // Validate links between resources
    bundle.entry.forEach((entry: any) => {
      const resource = entry.resource;

      if (resource.resourceType === 'ServiceRequest') {
        this.validateReference(resource.requester, resourceMap, 'Practitioner');
      }

      if (resource.resourceType === 'Task') {
        this.validateReference(
          resource.basedOn[0],
          resourceMap,
          'ServiceRequest',
        );
        this.validateReference(resource.requester, resourceMap, 'Practitioner');
      }
    });
  }

  private validateReference(
    reference: any,
    resourceMap: Map<string, any>,
    expectedResourceType: string,
  ): void {
    if (!reference || !reference.reference) {
      throw new BadRequestException(
        `Missing reference to ${expectedResourceType}`,
      );
    }
    const referencedResource = resourceMap.get(reference.reference);
    if (
      !referencedResource ||
      referencedResource.resourceType !== expectedResourceType
    ) {
      throw new BadRequestException(
        `Invalid reference to ${expectedResourceType}`,
      );
    }
  }

  async saveBundle(bundle: R4.IBundle): Promise<R4.IBundle> {
    this.logger.log(`Posting ${bundle.resourceType}`);

    try {
      const ret = await this.fhirService.post(bundle);
      this.logger.log(`Saved bundle to FHIR store!`);
      return ret;
    } catch (error) {
      this.logger.error(`Could not save bundle:`, error);
      throw new BadRequestException({
        message: error.response?.data || 'Unable to save bundle',
      });
    }
  }

  // Entrypoint wrapper function for Lab Order Workflows
  async handleLabOrder(orderBundle: R4.IBundle): Promise<void> {
    try {
      await this.kafkaProducerService.sendPayloadWithRetryDMQ(
        { bundle: orderBundle },
        topicList.SEND_ADT_TO_IPMS,
      );
    } catch (e) {
      this.logger.error(`Could not handle lab order!\n${JSON.stringify(e)}`);
      throw new Error(`Could not handle lab order!\n${JSON.stringify(e)}`);
    }
  }

  async updateBundleWithPatientFromCR(
    labOrderBundle: R4.IBundle,
    patientRecord: R4.IPatient,
  ) {
    // Update the refs to the patient resource in the bundle
    labOrderBundle.entry = labOrderBundle.entry
      .filter(({ resource }) => resource.resourceType !== 'Patient')
      .map((entry) => {
        switch (entry.resource.resourceType) {
          case 'Practitioner':
            return entry;
          case 'ServiceRequest':
            return {
              ...entry,
              resource: {
                ...entry.resource,
                subject: {
                  reference: `${patientRecord.resourceType}/${patientRecord.id}`,
                },
              },
            };
          case 'Task':
            return {
              ...entry,
              resource: {
                ...entry.resource,
                for: {
                  reference: `${patientRecord.resourceType}/${patientRecord.id}`,
                },
              },
            };
          default:
            throw new BadRequestException(
              `Unknown resource type encountered ${entry.resource.resourceType}`,
            );
        }
      });

    // Add the patient resource to the bundle so that EMRs would receive a consistent response
    labOrderBundle.entry.push({
      fullUrl: `${patientRecord.resourceType}/${patientRecord.id}`,
      resource: patientRecord,
      request: {
        method: R4.Bundle_RequestMethodKind._put,
        url: `${patientRecord.resourceType}/${patientRecord.id}`,
      },
    });

    return labOrderBundle;
  }
}
