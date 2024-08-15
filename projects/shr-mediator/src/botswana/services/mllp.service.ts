import { MllpServer } from '@i-tech-uw/mllp-server';
import { Injectable, OnModuleInit } from '@nestjs/common';
import config from '../../config';
import { Hl7Service } from './hl7.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class MllpService implements OnModuleInit {
  // Used to send ADT/ORM and receive ADT and ACK back (listens on 3001)
  private mllpServer: MllpServer;

  // Used to receive ORU (listens on 3002)
  private oruMllpServer: MllpServer;

  constructor(
    private readonly hl7Handler: Hl7Service,
    private readonly logger: LoggerService,
  ) {
    this.mllpServer = new MllpServer('0.0.0.0', config.get('app:mllpPort'));
    this.oruMllpServer = new MllpServer(
      '0.0.0.0',
      config.get('app:oruMllpPort'),
    );
  }

  onModuleInit() {
    this.mllpServer.listen((err?: Error) => {
      if (err) {
        this.logger.error('Unable to start the ADT/ORM MLLP server', err);
        return;
      }

      this.logger.log(
        `TCP Server is up and listening on port: ${config.get('app:mllpPort')}`,
      );
    });

    this.oruMllpServer.listen((err?: Error) => {
      if (err) {
        this.logger.error('Unable to start the ORU MLLP server', err);
        return;
      }

      this.logger.log(
        `TCP Server is up and listening on port: ${config.get('app:oruMllpPort')}`,
      );
    });

    this.mllpServer.on('hl7', async (data: any) => {
      this.logger.debug('Received message:', data.toString());
      const checkChar: string = data[data.length - 1];
      if (checkChar == '\r') {
        await this.hl7Handler.handleMessage(data);
      } else {
        this.logger.warn('Malformed HL7 Message:\n' + data);
      }
    });

    this.oruMllpServer.on('hl7', async (data: any) => {
      this.logger.debug('Received ORU message:', data.toString());
      const checkChar: string = data[data.length - 1];
      if (checkChar == '\r') {
        await this.hl7Handler.handleMessage(data);
      } else {
        this.logger.warn('Malformed HL7 ORU Message:\n' + data);
      }
    });
  }

  async send(
    message: string,
    targetHost?: string,
    port?: number,
    retries?: number,
  ) {
    const targeHostToSend = targetHost || 'example.com';
    const portToSend = port || 3000;

    message = message.replace(/[\n\r]/g, '\r');
    const firstNewline = message.match(/\r/);
    const header = firstNewline ? message.substring(0, firstNewline.index) : '';
    return new Promise((resolve, reject) => {
      this.mllpServer.send(
        targeHostToSend,
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
