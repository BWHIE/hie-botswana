import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  Producer,
  ProducerRecord,
  Transaction,
} from '@nestjs/microservices/external/kafka.interface';
import config from '../../config';
import { topicList } from '../utils/topics';
import { sleep } from '../utils/helpers';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private producer: Producer;

  private readonly maxRetries = config.get('retryConfig:kafkaMaxRetries') || 5; // Maximum number of retries
  private readonly initialDelay =
    config.get('retryConfig:kafkaRetryDelay') || 2000; // Initial delay in milliseconds

  constructor(
    @Inject('KAFKA_SERVICE') private readonly clientKafka: ClientKafka,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    this.producer = await this.clientKafka.connect();
    await this.producer.connect();
  }

  /**
   * Sends a payload to a Kafka topic.
   * @param payload - The payload to send.
   * @param topic - The Kafka topic to send the payload to.
   * @returns A Promise that resolves when the payload has been sent.
   */
  public async sendPayload(payload: any, topic: string) {
    let val = '';

    if (payload && (payload.bundle || payload.resourceType)) {
      val = JSON.stringify(payload);
    } else {
      val = payload;
    }

    const records: ProducerRecord[] = [
      {
        topic: topic,
        messages: [{ key: 'body', value: val }],
      },
    ];

    try {
      this.logger.log(`Sending payload to topic ${topic}!`);
      await this.sendMessageTransactionally(records);
    } catch (err) {
      console.error(`Error sending payload to topic ${topic}: ${err}`);
      throw new Error(`Error sending payload to topic ${topic}: ${err}`);
    }
  }

  /**
   * Sends a payload to a Kafka topic with exponential retry and DMQ logging.
   * @param payload - The payload to send.
   * @param topic - The Kafka topic to send the payload to.
   * @param maxRetries - Maximum number of retries before sending to DMQ.
   * @param retryDelay - Initial delay before the first retry, subsequent retries double this delay.
   * @returns A Promise that resolves when the payload has been sent or logged to DMQ.
   */
  public async sendPayloadWithRetryDMQ(
    payload: any,
    topic: string,
    myMaxRetries: number = this.maxRetries,
    myRetryDelay: number = this.initialDelay,
  ) {
    let val = '';

    if (payload && (payload.bundle || payload.resourceType)) {
      val = JSON.stringify(payload);
    } else if (payload && payload.message) {
      val = payload.message;
    } else {
      val = payload;
    }

    let error;
    const records: ProducerRecord[] = [
      {
        topic: topic,
        messages: [{ key: 'body', value: val }],
      },
    ];

    let attempt = 0;

    while (attempt < myMaxRetries) {
      try {
        this.logger.log(
          `Attempt ${attempt + 1}: Sending payload to topic ${topic}!`,
        );
        await this.sendMessageTransactionally(records);
        return; // Success, exit the function.
      } catch (err) {
        error = err;
        this.logger.error(
          `Attempt ${attempt + 1}: Error sending payload to topic ${topic}: ${err}`,
        );
        attempt++;
        await sleep(myRetryDelay * Math.pow(2, attempt - 1)); // Exponential back-off.
      }
    }

    // If all retries fail, send to Dead Message Queue.
    if (error && attempt >= myMaxRetries) {
      this.logger.error(`All retries failed. Sending payload to DMQ!`);
      try {
        await this.sendPayload(
          { payload: payload, topic: topic, error: error },
          topicList.DMQ,
        );
      } catch (dmqError) {
        this.logger.error(`Failed to send payload to DMQ: ${dmqError}`);
        throw new Error(`Failed to send payload to DMQ: ${dmqError}`);
      }
    }
  }

  /**
   * Sends message using transaction.
   * @param {ProducerRecord[]} records - Array of producer records to send.
   * @returns {Promise<void>} Promise that resolves when message is sent transactionally.
   * @throws {Error} If producer is not initialized or transaction fails.
   */
  public async sendMessageTransactionally(
    records: ProducerRecord[],
  ): Promise<void> {
    if (!this.producer) {
      this.logger.error('Producer is not initialized.');
      throw new Error('Producer is not initialized.');
    }

    const transaction: Transaction = await this.producer.transaction();
    try {
      for (const record of records) {
        await transaction.send(record);
      }
      await transaction.commit();
      this.logger.log('Message sent transactionally.');
    } catch (err) {
      console.log('333333', err);
      await transaction.abort();
      this.logger.log('Message failed to be sent transactionally.', err);
      throw err;
    }
  }
}
