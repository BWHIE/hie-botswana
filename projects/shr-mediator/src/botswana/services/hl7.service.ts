import { R4 } from '@ahryman40k/ts-fhir-types';
import { BundleTypeKind, IBundle } from '@ahryman40k/ts-fhir-types/lib/R4';
import { Injectable } from '@nestjs/common';
import { topicList } from '../utils/topics';
import { KafkaProducerService } from './kafka-producer.service';
import config from '../../config';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../../logger/logger.service';
import * as hl7 from 'hl7';

@Injectable()
export class Hl7Service {
  constructor(
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {}

  public static errorBundle: IBundle = {
    resourceType: 'Bundle',
    type: BundleTypeKind._transactionResponse,
    entry: [
      {
        response: {
          status: '500 Server Error',
        },
      },
    ],
  };

  public async handleMessage(data: any): Promise<any> {
    try {
      this.logger.log('received payload:', data);
      // Determine Message Type
      const parsed = hl7.parseString(data);
      const msgType: string = parsed[0][9][0][0];
      if (msgType == 'ADT') {
        this.logger.log('Handling ADT Message');
        return this.handleAdtMessage(data);
      } else if (msgType == 'ORU') {
        this.logger.log('Handling ORU Message');
        return this.handleOruMessage(data);
      } else {
        this.logger.error('Message unsupported!');
        return {
          type: BundleTypeKind._transactionResponse,
          resourceType: 'Bundle',
          entry: [{ response: { status: '501 Not Implemented' } }],
        };
      }
    } catch (error) {
      this.logger.error(error);
      return {
        type: BundleTypeKind._transactionResponse,
        resourceType: 'Bundle',
        entry: [{ response: { status: '500 Server Error' } }],
      };
    }
  }

  async handleAdtMessage(hl7Msg: string): Promise<void> {
    this.logger.log(hl7Msg);
    try {
      this.kafkaProducerService.sendPayloadWithRetryDMQ(
        { message: hl7Msg },
        topicList.HANDLE_ADT_FROM_IPMS,
      );
    } catch (error: any) {
      this.logger.error(`Could not translate and save ADT message!`, error);
    }
  }

  async handleOruMessage(hl7Msg: string): Promise<R4.IBundle> {
    try {
      const translatedBundle: R4.IBundle = await this.translateBundle(
        hl7Msg,
        'bwConfig:fromIpmsOruTemplate',
      );

      if (
        translatedBundle != Hl7Service.errorBundle &&
        translatedBundle.entry
      ) {
        this.kafkaProducerService.sendPayload(
          { bundle: translatedBundle },
          topicList.HANDLE_ORU_FROM_IPMS,
        );
        return translatedBundle;
      } else {
        return Hl7Service.errorBundle;
      }
    } catch (error: any) {
      this.logger.error(
        `Could not save ORU message!\n${JSON.stringify(error)}`,
      );
      return Hl7Service.errorBundle;
    }
  }

  async translateBundle(hl7Msg: string, templateConfigKey: string) {
    const maxRetries = config.get('retryConfig:translatorMaxRetries') || 5;
    const delay = config.get('retryConfig:translatorRetryDelay') || 2000;

    // The errorCheck function defines the criteria for retrying based on the operation's result
    const errorCheck = (result: R4.IBundle) =>
      result === Hl7Service.errorBundle;

    // Define the payload for DMQ in case of failure
    const payloadForDMQ = { hl7Msg, templateConfigKey };

    // Use the retryOperation method with the new errorCheck criteria
    return await this.retryOperation(
      () => this.getHl7Translation(hl7Msg, config.get(templateConfigKey)),
      maxRetries,
      delay,
      errorCheck,
      payloadForDMQ,
    );
  }

  async retryOperation(
    func: () => any,
    maxRetries: number,
    delay: number,
    errorCheck: (result: any) => boolean,
    payloadForDMQ: any,
  ) {
    let attempts = 0;
    let result: any;
    while (attempts < maxRetries) {
      try {
        result = await func();
        // Check if the result meets the criteria to be considered successful
        if (!errorCheck(result)) {
          return result; // If result is satisfactory, return it
        }
        // If result is not satisfactory, log and prepare for a retry
        this.logger.log(
          `Retry criteria not met, attempt ${attempts + 1} of ${maxRetries}`,
        );
      } catch (error) {
        this.logger.error(`Error on attempt ${attempts + 1}: ${error}`);
        // If this was the last attempt, handle DMQ logic
        if (attempts === maxRetries - 1) {
          this.logger.error(
            `Max retries reached, sending to Kafka DMQ topic. Error: ${error}`,
          );
          await this.kafkaProducerService.sendMessageTransactionally([
            {
              topic: topicList.DMQ,
              messages: [{ value: JSON.stringify(payloadForDMQ) }],
            },
          ]);
          throw new Error(
            'Operation failed after maximum retries, message sent to DMQ.',
          );
        }
      }
      // Prepare for the next attempt
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
    // If max retries are reached and the result is still not satisfactory, consider it a failure
    throw new Error(
      'Operation failed after maximum retries based on result criteria.',
    );
  }

  async getHl7Translation(
    hl7Message: string,
    template: string,
  ): Promise<R4.IBundle> {
    try {
      const { data: translatedMessage } = await this.httpService.axiosRef.post<{
        fhirResource: R4.IBundle;
      }>(
        `${config.get('fhirConverterUrl')}/api/convert/hl7v2/${template}`,
        hl7Message.replace(/\r/g, '\n'),
        {
          headers: {
            'content-type': 'text/plain',
          },
        },
      );

      return translatedMessage.fhirResource;
    } catch (error: any) {
      this.logger.error(
        `Could not translate HL7 message\n${hl7Message}\nwith template ${template}!\n${JSON.stringify(
          error,
        )}`,
      );

      return Hl7Service.errorBundle;
    }
  }

  async getFhirTranslation(
    bundle: R4.IBundle,
    template: string,
  ): Promise<string> {
    try {
      const { data } = await this.httpService.axiosRef.request<any>({
        url: `${config.get('fhirConverterUrl')}/api/convert/fhir/${template}`,
        headers: {
          'content-type': 'application/json',
        },
        data: JSON.stringify(bundle),
        method: 'POST',
      });

      return data;
    } catch (error: any) {
      this.logger.error(
        `Could not translate FHIR Bundle message\n${JSON.stringify(
          bundle,
        )}\n with template ${template}!\n${JSON.stringify(error)}`,
      );
      return '';
    }
  }

  async getFhirTranslationWithRetry(
    bundle: R4.IBundle,
    template: string,
  ): Promise<string> {
    // Define your retry parameters
    const maxRetries = config.get('retryConfig:translatorMaxRetries') || 5;
    const delay = config.get('retryConfig:translatorRetryDelay') || 2000;

    const errorCheck = (result: R4.IBundle) =>
      result === Hl7Service.errorBundle;

    const payloadForDMQ = { bundle, template };

    return await this.retryOperation(
      () => this.getFhirTranslation(bundle, template),
      maxRetries,
      delay,
      errorCheck,
      payloadForDMQ,
    );
  }
}
