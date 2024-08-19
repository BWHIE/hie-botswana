import { R4 } from '@ahryman40k/ts-fhir-types';
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
