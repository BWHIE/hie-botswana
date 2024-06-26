import { Injectable, LoggerService, OnModuleInit } from '@nestjs/common';
import { MllpServer } from '@i-tech-uw/mllp-server';
import { config } from 'src/config';
import * as hl7 from 'hl7';
import { BundleTypeKind, IBundle } from '@ahryman40k/ts-fhir-types/lib/R4';
import { Hl7WorkflowsBw } from './hl7-workflow-bw.service';

@Injectable()
export class MllpServerService implements OnModuleInit {
  private mllpServer: MllpServer;

  constructor(
    private readonly hl7WorkflowsBw: Hl7WorkflowsBw,
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
        const response: IBundle = await this.handleMessage(data);

        this.logger.log('HL7 Response:\n' + JSON.stringify(response));
      } else {
        this.logger.warn('Malformed HL7 Message:\n' + data);
      }
    });
  }

  public async handleMessage(data: any): Promise<any> {
    try {
      this.logger.log('received payload:', data);
      // Determine Message Type
      const parsed = hl7.parseString(data);
      const msgType: string = parsed[0][9][0][0];

      if (msgType == 'ADT') {
        this.logger.log('Handling ADT Message');
        return this.hl7WorkflowsBw.handleAdtMessage(data);
      } else if (msgType == 'ORU') {
        this.logger.log('Handling ORU Message');
        return this.hl7WorkflowsBw.handleOruMessage(data);
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
}
