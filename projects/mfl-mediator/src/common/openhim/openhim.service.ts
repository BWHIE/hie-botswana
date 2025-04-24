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
import { AxiosError } from "axios";
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
} from "./types";

export const OPENHIM_TRANSACTION_ID = "x-openhim-transactionid";

/**
 * Service for managing OpenHIM communication and transaction handling.
 * This service provides methods for registering the mediator, managing transactions,
 * and building standardized OpenHIM responses.
 */
@Injectable()
export class OpenHimService implements OnModuleInit {
  private readonly logger = new Logger(OpenHimService.name);
  private readonly openhimConfig: OpenHimConfig;
  private readonly mediatorConfig: MediatorConfig;

  constructor(private readonly httpService: HttpService) {
    this.openhimConfig = config.get("mediatorConfig:openHimAuth");
    this.mediatorConfig = config.get("mediatorConfig:mediatorSetup");
  }

  /**
   * Initializes the OpenHIM service by setting up the mediator configuration.
   * This method is called automatically when the module is initialized.
   */
  async onModuleInit() {
    await this.setupMediator();
  }

  /**
   * Sets up the mediator in the OpenHIM server.
   * This method registers the mediator configuration and starts the heartbeat mechanism.
   */
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

  /**
   * Registers a new transaction with OpenHIM.
   *
   * @param transaction - Partial transaction data to register
   * @returns Promise containing the registered transaction details
   * @throws Error if registration fails
   */
  async registerTransaction(transaction: Partial<OpenHIMTransaction>) {
    try {
      this.logger.debug("Attempting to register transaction with OpenHIM", {
        url: `${this.openhimConfig.apiURL}/transactions`,
        transaction: JSON.stringify(transaction),
      });

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

      this.logger.debug("Successfully registered transaction with OpenHIM", {
        transactionId: response.data._id,
        status: response.data.status,
      });

      return {
        transactionId: response.data._id,
        status: response.data.status,
        response: response.data.response,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error("Error registering transaction:", {
        error: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
        headers: axiosError.response?.headers,
        config: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          headers: axiosError.config?.headers,
        },
      });
      throw error;
    }
  }

  /**
   * Updates an existing transaction in OpenHIM.
   *
   * @param id - The transaction ID to update
   * @param updates - Partial transaction data containing updates
   * @throws Error if update fails
   */
  async updateTransaction(id: string, updates: Partial<OpenHIMTransaction>) {
    try {
      await this.httpService
        .put(`${this.openhimConfig.apiURL}/transactions/${id}`, updates, {
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
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error("Error updating transaction:", {
        error: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
      throw error;
    }
  }

  /**
   * Retrieves a transaction from OpenHIM by ID.
   *
   * @param transactionId - The ID of the transaction to retrieve
   * @returns Promise containing the transaction data
   * @throws Error if retrieval fails
   */
  async getTransaction(transactionId: string) {
    try {
      const response = await this.httpService
        .get(`${this.openhimConfig.apiURL}/transactions/${transactionId}`, {
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

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error("Error getting OpenHIM transaction:", {
        error: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
      throw error;
    }
  }

  /**
   * Converts HTTP headers to OpenHIM-compatible format.
   * Handles both single values and arrays of values.
   *
   * @param headers - Raw HTTP headers to convert
   * @returns OpenHIM-compatible headers
   */
  buildOpenHimHeaders(
    headers: Record<string, string | string[] | undefined>
  ): OpenHimHeaders {
    const result: OpenHimHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        result[key] = Array.isArray(value) ? value.join(", ") : value;
      }
    }
    return result;
  }

  /**
   * Builds a standardized OpenHIM response object.
   *
   * @param status - The status of the response
   * @param statusCode - HTTP status code
   * @param body - Response body to be stringified
   * @param orchestrations - Optional array of orchestrations
   * @param error - Optional error details
   * @param properties - Optional additional properties
   * @param headers - Optional response headers
   * @returns Formatted OpenHIM response
   */
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
        timestamp: new Date().toISOString(),
      },
      orchestrations,
      properties,
      error,
    };
  }

  /**
   * Extracts the transaction ID from HTTP headers.
   *
   * @param headers - HTTP headers containing the transaction ID
   * @returns The transaction ID or undefined if not found
   */
  parseTransactionIdFromHeaders(headers: IncomingHttpHeaders): string {
    return headers[OPENHIM_TRANSACTION_ID] as string;
  }

  /**
   * Extracts the access token from the Authorization header.
   *
   * @param headers - HTTP headers containing the Authorization header
   * @returns The access token or undefined if not found
   */
  parseAccessTokenFromHeaders(
    headers: IncomingHttpHeaders
  ): string | undefined {
    const auth = (headers["authorization"] as string) || "";
    const [, token] = auth.split(" ");
    return token;
  }
}
