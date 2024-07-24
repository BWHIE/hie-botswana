import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import {
  activateHeartbeat,
  fetchConfig,
  registerMediator,
} from 'openhim-mediator-utils';
import config from 'src/config';
import { IncomingHttpHeaders } from 'http';
import { HttpService } from '@nestjs/axios';
import {
  OpenHimConfig,
  MediatorConfig,
  OpenHimHeaders,
  OpenHimStatus,
  OpenHimOrchestration,
  OpenHimError,
  OpenHimResponse,
} from './types';

export const OPENHIM_TRANSACTION_ID = 'x-openhim-transactionid';

@Injectable()
export class OpenHimService implements OnModuleInit {
  private readonly logger = new Logger(OpenHimService.name);
  private readonly openhimConfig: OpenHimConfig;
  private readonly mediatorConfig: MediatorConfig;

  constructor(private readonly httpService: HttpService) {
    this.openhimConfig = config.get('mediatorConfig:openHimAuth');
    this.mediatorConfig = config.get('mediatorConfig:mediatorSetup');
  }

  async onModuleInit() {
    await this.setupMediator();
  }

  async setupMediator() {
    const config = {
      ...this.openhimConfig,
      urn: this.mediatorConfig.urn,
    };
    registerMediator(config, this.mediatorConfig, (error: Error) => {
      if (error) {
        this.logger.error(`Failed to register mediator: ${error.message}`);
        throw new Error(`Failed to register mediator: ${error.message}`);
      }

      this.logger.log('Successfully registered mediator!');

      fetchConfig(config, async (error: Error) => {
        if (error) {
          this.logger.error(`Failed to fetch initial config: ${error.message}`);
          throw new Error(`Failed to fetch initial config: ${error.message}`);
        }

        const emitter = await activateHeartbeat(config);
        emitter.on('error', (error: Error) => {
          this.logger.error(`Heartbeat failed: ${JSON.stringify(error)}`);
        });

        emitter.on('config', (newConfig) => {
          this.logger.debug(
            'Received updated config:',
            JSON.stringify(newConfig),
          );
        });
      });
    });
  }

  async updateOpenHimTransaction(
    openHimTransactionId: string,
    data: any,
    orchestrations: any[] = [],
  ) {
    if (this.openhimConfig.apiURL && openHimTransactionId) {
      await this.httpService.axiosRef.put(
        `${this.openhimConfig.apiURL}/transactions/${openHimTransactionId}`,
        {
          status: 'Successful',
          orchestrations,
          response: {
            headers: {
              [OPENHIM_TRANSACTION_ID]: openHimTransactionId,
            },
            status: 201,
            body: data,
          },
        },
        {
          headers: {
            [OPENHIM_TRANSACTION_ID]: openHimTransactionId,
            Authorization:
              'Basic ' +
              Buffer.from(
                this.openhimConfig.username + ':' + this.openhimConfig.password,
              ).toString('base64'),
          },
        },
      );
    } else {
      this.logger.error(
        'Either openHIM Url or transaction ID is not supplied',
        data,
      );
      throw new BadRequestException(
        'Unable to update OpenHIM async transaction',
      );
    }
  }

  async getOpenHimTransaction(transactionId: string) {
    if (this.openhimConfig.apiURL && transactionId) {
      return await this.httpService.axiosRef.get(
        `${this.openhimConfig.apiURL}/transactions/${transactionId}`,
        {
          headers: {
            Authorization:
              'Basic ' +
              Buffer.from(
                this.openhimConfig.username + ':' + this.openhimConfig.password,
              ).toString('base64'),
          },
        },
      );
    } else {
      this.logger.error('Either openHIM Url or transaction ID is not supplied');
      throw new BadRequestException(
        'Unable to update OpenHIM async transaction',
      );
    }
  }

  buildOpenHimHeaders(headers: Headers): OpenHimHeaders {
    const openHimHeaders = {};
    for (const [key, value] of headers) {
      openHimHeaders[key] = value;
    }
    return openHimHeaders;
  }

  buildOpenHimResponse(
    status: OpenHimStatus,
    statusCode: number,
    body: unknown,
    orchestrations: OpenHimOrchestration[] = [],
    error?: OpenHimError,
    properties?: Record<string, string>,
    headers?: OpenHimHeaders,
  ): OpenHimResponse {
    return {
      'x-mediator-urn': this.mediatorConfig.urn,
      status,
      response: {
        status: statusCode,
        headers: headers || {},
        body: JSON.stringify(body),
        timestamp: new Date(),
      },
      orchestrations,
      properties,
      error,
    };
  }

  parseTransactionIdFromHeaders(headers: IncomingHttpHeaders): string {
    return (headers[OPENHIM_TRANSACTION_ID] as string) || '';
  }

  parseAccessTokenFromHeaders(
    headers: IncomingHttpHeaders,
  ): string | undefined {
    const auth = (headers['authorization'] as string) || '';
    const [, token] = auth.split(' ');
    return token;
  }
}
