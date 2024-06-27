import { R4 } from '@ahryman40k/ts-fhir-types';
import { BundleTypeKind } from '@ahryman40k/ts-fhir-types/lib/R4';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
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

  async saveBundle(bundle: R4.IBundle): Promise<R4.IBundle> {
    this.logger.log(`Posting ${bundle.resourceType}`);

    if (!bundle.type || bundle.type != BundleTypeKind._transaction) {
      bundle = this.translateToTransactionBundle(bundle);
    }
    try {
      const ret = await this.fhirService.postWithRetry(bundle);
      this.logger.log(`Saved bundle to FHIR store!`);
      return ret;
    } catch (error) {
      this.logger.error(`Could not save bundle:`, error);

      throw new InternalServerErrorException(
        'Could not save bundle to hapi server!',
      );
    }
  }

  translateToTransactionBundle(bundle: R4.IBundle): R4.IBundle {
    if (bundle.type && bundle.type == BundleTypeKind._transaction) {
      this.logger.log('Bundle already has transaction type.');
    } else {
      bundle.type = R4.BundleTypeKind._transaction;
      bundle.link = [
        {
          relation: 'self',
          url: 'responding.server.org/fhir',
        },
      ];

      if (bundle.entry) {
        for (const entry of bundle.entry) {
          if (entry.resource) {
            const resource = entry.resource;
            entry.request = {
              method: R4.Bundle_RequestMethodKind._put,
              url: `${resource.resourceType}/${resource.id}`,
            };
          }
        }
      }
    }

    return bundle;
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
}
