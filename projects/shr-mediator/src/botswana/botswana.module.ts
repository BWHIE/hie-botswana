import { Module } from '@nestjs/common';
import { MllpServerService } from './services/mllp-server.service';
import { Hl7WorkflowsBw } from './services/hl7-workflow-bw.service';
import { KafkaConsumerController } from './controllers/kafka-consumer.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import config from 'src/config';
import { logLevel } from 'kafkajs';
import { KafkaProducerService } from './services/kafka-producer.service';
import { HttpModule } from '@nestjs/axios';

const brokers = config.get('taskRunner:brokers') || ['kafka:9092'];

@Module({
  imports: [
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
  controllers: [KafkaConsumerController],
  providers: [MllpServerService, Hl7WorkflowsBw, KafkaProducerService],
})
export class BotswanaModule {}
