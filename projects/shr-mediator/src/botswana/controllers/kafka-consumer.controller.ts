import { IBundle, IPatient } from '@ahryman40k/ts-fhir-types/lib/R4';
import { Controller, Inject } from '@nestjs/common';
import {
  ClientKafka,
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { LoggerService } from '../../logger/logger.service';
import { IpmsService } from '../services/ipms.service';
import { KafkaProducerService } from '../services/kafka-producer.service';
import { LabWorkflowService } from '../services/lab-workflow.service';
import { MflService } from '../services/mfl.service';
import { MpiService } from '../services/mpi.service';
import { TerminologyService } from '../services/terminology.service';
import { topicList } from '../utils/topics';
import { BundlePayload } from '../../common/utils/fhir';

@Controller()
export class KafkaConsumerController {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly clientKafka: ClientKafka,
    private readonly terminologyService: TerminologyService,
    private readonly mflService: MflService,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly ipmsService: IpmsService,
    private readonly labService: LabWorkflowService,
    private readonly mpiService: MpiService,
    private readonly logger: LoggerService,
  ) {}

  private async commitOffsets(context: KafkaContext) {
    const { offset } = context.getMessage();
    const partition = context.getPartition();
    const topic = context.getTopic();
    await this.clientKafka.commitOffsets([{ topic, partition, offset }]);
  }

  @EventPattern(topicList.SEND_ADT_TO_IPMS)
  async handleSendAdtToIpms(
    @Payload() val: BundlePayload,
    @Ctx() context: KafkaContext,
  ) {
    try {
      const origBundle: IBundle = val.bundle;

      let enrichedBundle =
        await this.terminologyService.mapConcepts(origBundle);
      enrichedBundle = await this.mflService.mapLocations(enrichedBundle);

      this.kafkaProducerService.sendPayloadWithRetryDMQ(
        { bundle: enrichedBundle },
        topicList.SAVE_PIMS_PATIENT,
      );

      enrichedBundle = await this.ipmsService.sendAdtToIpms(enrichedBundle);

      // Succeed only if this bundle saves successfully
      await this.labService.saveBundle(enrichedBundle);

      await this.commitOffsets(context);
    } catch (err) {
      this.logger.error('Unable to process SEND_ADT_TO_IPMS', err);
    }
  }

  @EventPattern(topicList.HANDLE_ADT_FROM_IPMS)
  async handleAdtFromIpms(
    @Payload() hl7Message: string,
    @Ctx() context: KafkaContext,
  ) {
    try {
      const adtRes = await this.ipmsService.handleAdtFromIpms(hl7Message);

      if (adtRes && adtRes.patient) {
        this.kafkaProducerService.sendPayloadWithRetryDMQ(
          adtRes.patient,
          topicList.SAVE_IPMS_PATIENT,
        );
      }

      if (adtRes && adtRes.taskBundle && adtRes.patient) {
        const enrichedBundle = await this.ipmsService.sendOrmToIpms(adtRes);

        // Succeed only if this bundle saves successfully
        await this.labService.saveBundle(enrichedBundle);
      } else {
        this.logger.error(
          `Could not handle ADT from IPMS!\n${JSON.stringify(adtRes)}`,
        );
      }
      await this.commitOffsets(context);
    } catch (err) {
      this.logger.error('Unable to process HANDLE_ADT_FROM_IPMS', err);
    }
  }

  @EventPattern(topicList.HANDLE_ORU_FROM_IPMS)
  async handleOruFromIpms(
    @Payload() val: string,
    @Ctx() context: KafkaContext,
  ) {
    try {
      await this.ipmsService.handleOruFromIpms(val);
      await this.commitOffsets(context);
    } catch (err) {
      this.logger.error('Unable to process HANDLE_ORU_FROM_IPMS', err);
    }
  }

  @EventPattern(topicList.SAVE_PIMS_PATIENT)
  async handleSavePimsPatient(
    @Payload() val: BundlePayload,
    @Ctx() context: KafkaContext,
  ) {
    try {
      const origBundle: IBundle = val.bundle;
      await this.mpiService.updateCrPatient(origBundle);
      await this.commitOffsets(context);
    } catch (err) {
      this.logger.error('Unable to process SAVE_PIMS_PATIENT', err);
    }
  }

  @EventPattern(topicList.SAVE_IPMS_PATIENT)
  async handleSaveIpmsPatient(
    @Payload() val: IPatient,
    @Ctx() context: KafkaContext,
  ) {
    try {
      const bundle: IBundle = {
        resourceType: 'Bundle',
        entry: [
          {
            resource: val,
          },
        ],
      };
      await this.mpiService.saveIpmsPatient(bundle);
      await this.commitOffsets(context);
    } catch (err) {
      this.logger.error('Unable to process SAVE_IPMS_PATIENT', err);
    }
  }
}
