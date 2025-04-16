import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import https from "https";
import {
  OpenHIMConfig,
  OpenHIMTransaction,
  OpenHIMTransactionResponse,
} from "./types";

@Injectable()
export class OpenhimService {
  private readonly logger = new Logger(OpenhimService.name);
  private config: OpenHIMConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      username: this.configService.get<string>("OPENHIM_USERNAME"),
      password: this.configService.get<string>("OPENHIM_PASSWORD"),
      apiURL: this.configService.get<string>("OPENHIM_API_URL"),
      trustSelfSigned: this.configService.get<boolean>(
        "OPENHIM_TRUST_SELF_SIGNED",
        true
      ),
      clientID: this.configService.get<string>("OPENHIM_CLIENT_ID"),
      clientPassword: this.configService.get<string>("OPENHIM_CLIENT_PASSWORD"),
    };
  }

  private getAxiosInstance() {
    return axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: !this.config.trustSelfSigned,
      }),
      auth: {
        username: this.config.username,
        password: this.config.password,
      },
    });
  }

  async registerTransaction(
    transaction: Partial<OpenHIMTransaction>
  ): Promise<OpenHIMTransactionResponse> {
    try {
      const axiosInstance = this.getAxiosInstance();
      const response = await axiosInstance.post(
        `${this.config.apiURL}/transactions`,
        transaction
      );
      return {
        transactionId: response.data._id,
        status: response.data.status,
        response: response.data.response,
      };
    } catch (error) {
      this.logger.error("Error registering transaction with OpenHIM:", error);
      throw error;
    }
  }

  async updateTransaction(
    transactionId: string,
    updates: Partial<OpenHIMTransaction>
  ): Promise<void> {
    try {
      const axiosInstance = this.getAxiosInstance();
      await axiosInstance.put(
        `${this.config.apiURL}/transactions/${transactionId}`,
        updates
      );
    } catch (error) {
      this.logger.error("Error updating transaction with OpenHIM:", error);
      throw error;
    }
  }

  async getTransaction(transactionId: string): Promise<OpenHIMTransaction> {
    try {
      const axiosInstance = this.getAxiosInstance();
      const response = await axiosInstance.get(
        `${this.config.apiURL}/transactions/${transactionId}`
      );
      return response.data;
    } catch (error) {
      this.logger.error("Error getting transaction from OpenHIM:", error);
      throw error;
    }
  }
}
