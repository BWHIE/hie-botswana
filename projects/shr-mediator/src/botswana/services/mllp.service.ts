import { IBundle } from '@ahryman40k/ts-fhir-types/lib/R4';
import { MllpServer } from '@i-tech-uw/mllp-server';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { config } from '../../config';
import { Hl7Service } from './hl7.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class MllpService implements OnModuleInit {
  private mllpServer: MllpServer;

  constructor(
    private readonly hl7Handler: Hl7Service,
    private readonly logger: LoggerService,
  ) {
    this.mllpServer = new MllpServer(
      '0.0.0.0',
      config.get('app:mllpPort'),
      logger,
    );
  }

  onModuleInit() {
    this.mllpServer.listen((err?: Error) => {
      if (err) {
        this.logger.error('Unable to start the MLLP server', err);
        return;
      }

      this.logger.log(
        `TCP Server is up and listening on port: ${config.get('app:mllpPort')}`,
      );
    });

    this.mllpServer.on('hl7', async (data: any) => {
      this.logger.debug('Received message:', data.toString());
      const checkChar: string = data[data.length - 1];
      if (checkChar == '\r') {
        const response: IBundle = await this.hl7Handler.handleMessage(data);

        this.logger.log('HL7 Response:\n' + JSON.stringify(response));
      } else {
        this.logger.warn('Malformed HL7 Message:\n' + data);
      }
    });
  }

  send(message: string, targetIp?: string, port?: number, retries?: number) {
    const targetIpToSend = targetIp || '0.0.0.0';
    const portToSend = port || 3000;

    message = message.replace(/[\n\r]/g, '\r');
    const firstNewline = message.match(/\r/);
    const header = firstNewline ? message.substring(0, firstNewline.index) : '';
    return new Promise((resolve, reject) => {
      this.mllpServer.send(
        targetIpToSend,
        portToSend,
        message,
        (err: any, ackData: any) => {
          this.logger.log(
            `Sending HL7 message ${header}!\n      err: ${err ? err : ''}\n      ackData: ${
              ackData ? ackData : ''
            }`,
          );
          if (err) {
            reject({ error: err, retries: retries });
          } else {
            this.logger.log(
              `Successfully sent HL7 message ${header} \n      with ${retries} retries left!`,
            );
            resolve(ackData);
          }
        },
      );
    });
  }
}
