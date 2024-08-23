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
import { R4 } from '@ahryman40k/ts-fhir-types';

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
      let bundle: IBundle = val.bundle;

      // Sent ADT 04 to IPMS and update task status
      bundle = await this.ipmsService.sendAdtToIpms(bundle);

      // Succeed only if this bundle saves successfully
      const taskEntry = bundle.entry.find(
        (e) => e.resource.resourceType === 'Task',
      );
      await this.labService.saveBundle({
        resourceType: 'Bundle',
        type: R4.BundleTypeKind._transaction,
        entry: [
          {
            request: {
              method: R4.Bundle_RequestMethodKind._put,
              url: `Task/${taskEntry.resource.id}`,
            },
            resource: taskEntry.resource,
          },
        ],
      });

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
      const adtResponseBundle =
        await this.ipmsService.handleAdtFromIpms(hl7Message);

      // Update patient (add MRN number)
      this.kafkaProducerService.sendPayloadWithRetryDMQ(
        adtResponseBundle.entry.find(
          ({ resource }) => resource.resourceType === 'Patient',
        )?.resource as R4.IPatient,
        topicList.SAVE_IPMS_PATIENT,
      );

      const task = adtResponseBundle.entry.find(
        ({ resource }) => resource.resourceType === 'Task',
      )?.resource as R4.ITask;

      if (task) {
        const bundle = await this.ipmsService.sendOrmToIpms(adtResponseBundle);

        const taskEntry = bundle.entry.find(
          (e) => e.resource.resourceType === 'Task',
        );
        // Succeed only if this bundle saves successfully
        await this.labService.saveBundle({
          resourceType: 'Bundle',
          type: R4.BundleTypeKind._transaction,
          entry: [
            {
              request: {
                method: R4.Bundle_RequestMethodKind._put,
                url: `Task/${taskEntry.resource.id}`,
              },
              resource: taskEntry.resource,
            },
          ],
        });
      } else {
        this.logger.error(
          `Could not handle ADT from IPMS!\n${JSON.stringify(adtResponseBundle)}`,
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
    @Payload() patient: IPatient,
    @Ctx() context: KafkaContext,
  ) {
    try {
      const bundle: IBundle = {
        resourceType: 'Bundle',
        entry: [
          {
            fullUrl: `Patient/${patient.id}`,
            resource: patient,
            request: {
              method: R4.Bundle_RequestMethodKind._put,
              url: `Patient/${patient.id}`,
            },
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
