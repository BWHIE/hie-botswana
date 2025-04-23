import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import {
  activateHeartbeat,
  fetchConfig,
  registerMediator,
} from "openhim-mediator-utils";
import { IncomingHttpHeaders } from "http";
import { HttpService } from "@nestjs/axios";
import config from "../../config";
import {
  OpenHimConfig,
  MediatorConfig,
  OpenHimHeaders,
  OpenHimStatus,
  OpenHimOrchestration,
  OpenHimError,
  OpenHimResponse,
  OpenHIMTransaction,
  OPENHIM_TRANSACTION_ID,
} from "./types";

@Injectable()
export class OpenhimService implements OnModuleInit {
  private readonly logger = new Logger(OpenhimService.name);
  private readonly openhimConfig: OpenHimConfig;
  private readonly mediatorConfig: MediatorConfig;

  constructor(private readonly httpService: HttpService) {
    this.openhimConfig = config.get("mediatorConfig:openHimAuth");
    this.mediatorConfig = config.get("mediatorConfig:mediatorSetup");
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

      this.logger.log("Successfully registered mediator!");

      fetchConfig(config, async (error: Error) => {
        if (error) {
          this.logger.error(`Failed to fetch initial config: ${error.message}`);
          throw new Error(`Failed to fetch initial config: ${error.message}`);
        }

        const emitter = await activateHeartbeat(config);
        emitter.on("error", (error: Error) => {
          this.logger.error(`Heartbeat failed: ${JSON.stringify(error)}`);
        });

        emitter.on("config", (newConfig) => {
          this.logger.debug(
            "Received updated config:",
            JSON.stringify(newConfig)
          );
        });
      });
    });
  }

  async registerTransaction(transaction: Partial<OpenHIMTransaction>) {
    try {
      const response = await this.httpService
        .post(`${this.openhimConfig.apiURL}/transactions`, transaction, {
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Basic " +
              Buffer.from(
                this.openhimConfig.username + ":" + this.openhimConfig.password
              ).toString("base64"),
          },
          httpsAgent: new (require("https").Agent)({
            rejectUnauthorized: !this.openhimConfig.trustSelfSigned,
          }),
        })
        .toPromise();

      return {
        transactionId: response.data._id,
        status: response.data.status,
        response: response.data.response,
      };
    } catch (error) {
      this.logger.error("Error registering transaction:", error);
      throw error;
    }
  }

  async updateTransaction(id: string, updates: Partial<OpenHIMTransaction>) {
    try {
      await this.httpService
        .put(`${this.openhimConfig.apiURL}/transactions/${id}`, updates, {
          headers: {
            "Content-Type": "application/json",
          },
          httpsAgent: new (require("https").Agent)({
            rejectUnauthorized: !this.openhimConfig.trustSelfSigned,
          }),
        })
        .toPromise();
    } catch (error) {
      this.logger.error("Error updating transaction:", error);
      throw error;
    }
  }

  async updateOpenHimTransaction(
    openHimTransactionId: string,
    data: any,
    orchestrations: any[] = []
  ) {
    try {
      const response = await this.httpService
        .put(
          `${this.openhimConfig.apiURL}/transactions/${openHimTransactionId}`,
          {
            status: "Successful",
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
              "Content-Type": "application/json",
              Authorization:
                "Basic " +
                Buffer.from(
                  this.openhimConfig.username +
                    ":" +
                    this.openhimConfig.password
                ).toString("base64"),
            },
            httpsAgent: new (require("https").Agent)({
              rejectUnauthorized: !this.openhimConfig.trustSelfSigned,
            }),
          }
        )
        .toPromise();

      return response.data;
    } catch (error) {
      this.logger.error("Error updating transaction:", error);
      throw error;
    }
  }

  async getOpenHimTransaction(transactionId: string) {
    try {
      const response = await this.httpService
        .get(`${this.openhimConfig.apiURL}/transactions/${transactionId}`, {
          headers: {
            "Content-Type": "application/json",
          },
          httpsAgent: new (require("https").Agent)({
            rejectUnauthorized: !this.openhimConfig.trustSelfSigned,
          }),
        })
        .toPromise();

      return response.data;
    } catch (error) {
      this.logger.error("Error getting OpenHIM transaction:", error);
      throw error;
    }
  }

  buildOpenHimHeaders(headers: Headers): OpenHimHeaders {
    const result: OpenHimHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
      result[key] = String(value);
    }
    return result;
  }

  buildOpenHimResponse(
    status: OpenHimStatus,
    statusCode: number,
    body: unknown,
    orchestrations: OpenHimOrchestration[] = [],
    error?: OpenHimError,
    properties?: Record<string, string>,
    headers?: OpenHimHeaders
  ): OpenHimResponse {
    return {
      "x-mediator-urn": this.mediatorConfig.urn,
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
    return headers["x-openhim-transactionid"] as string;
  }

  parseAccessTokenFromHeaders(
    headers: IncomingHttpHeaders
  ): string | undefined {
    const authHeader = headers.authorization;
    if (!authHeader) return undefined;
    return authHeader.split(" ")[1];
  }
}
