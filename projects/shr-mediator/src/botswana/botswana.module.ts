import { Module } from '@nestjs/common';
import { MllpService } from './services/mllp.service';
import { Hl7Service } from './services/hl7.service';
import { KafkaConsumerController } from './controllers/kafka-consumer.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import config from 'src/config';
import { logLevel } from 'kafkajs';
import { KafkaProducerService } from './services/kafka-producer.service';
import { HttpModule } from '@nestjs/axios';
import { CommonModule } from 'src/common/common.module';
import { LabController } from './controllers/lab.controller';
import { LabWorkflowService } from './services/lab-workflow.service';
import { TerminologyService } from './services/terminology.service';
import { MflService } from './services/mfl.service';
import { IpmsService } from './services/ipms.service';
import { MpiService } from './services/mpi.service';

const brokers = config.get('taskRunner:brokers') || ['kafka:9092'];

@Module({
  imports: [
    CommonModule,
    HttpModule,
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'shr-mediator',
            brokers: brokers,
            logLevel: config.get('taskRunner:logLevel') || logLevel.ERROR,
          },
          consumer: {
            groupId: 'shr-consumer-group',
            allowAutoTopicCreation: false,
          },
          producer: {
            transactionalId: 'shr-producer-transaction',
            idempotent: true,
            maxInFlightRequests: 1,
          },
        },
      },
    ]),
  ],
  controllers: [KafkaConsumerController, LabController],
  providers: [
    MllpService,
    Hl7Service,
    KafkaProducerService,
    LabWorkflowService,
    TerminologyService,
    IpmsService,
    MflService,
    MpiService,
  ],
})
export class BotswanaModule {}
