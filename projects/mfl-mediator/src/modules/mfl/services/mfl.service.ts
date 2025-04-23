import { Injectable, Logger } from "@nestjs/common";
import { TransactionService } from "../../../common/openhim/transaction/transaction.service";
import config from "../../../config";
import { fhirR4 } from "@smile-cdr/fhirts";
import { ApiService } from "./api.service";
import { ApiError } from "../errors/api.error";

@Injectable()
export class MflService {
  private readonly logger = new Logger(MflService.name);

  constructor(
    private readonly apiService: ApiService,
    private readonly transactionService: TransactionService
  ) {}

  private convertHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      result[key] = String(value);
    }
    return result;
  }

  private async handleApiCall<T>(
    type: string,
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body: any = {}
  ): Promise<T> {
    const transaction = await this.transactionService.createTransaction({
      type,
      request: {
        method,
        url,
        headers: {
          "Content-Type": "application/json",
        },
        body,
      },
    });

    try {
      const response = await this.apiService.makeRequest<T>(method, url, {
        headers: {
          "Content-Type": "application/json",
        },
        data: body,
      });

      await this.transactionService.updateTransaction(transaction.id, {
        response: {
          status: 200,
          headers: {},
          body: response,
        },
        status: "completed",
      });

      return response;
    } catch (error) {
      this.logger.error(`API call failed for ${type}:`, {
        url,
        error: error.message,
        status: error.statusCode,
        response: error.responseData,
      });

      await this.transactionService.updateTransaction(transaction.id, {
        response: {
          status: error.statusCode || 500,
          headers: {},
          body: error.responseData || { error: error.message },
        },
        status: "failed",
      });

      throw error;
    }
  }

  async getLocations(): Promise<fhirR4.Bundle> {
    return this.handleApiCall<fhirR4.Bundle>(
      "mfl",
      `${config.get("mfl:apiUrl")}/bundle/location`
    );
  }

  async getLocation(id: string): Promise<fhirR4.Location> {
    return this.handleApiCall<fhirR4.Location>(
      "mfl",
      `${config.get("mfl:apiUrl")}/location/${id}`
    );
  }

  async getOrganizations(): Promise<fhirR4.Bundle> {
    return this.handleApiCall<fhirR4.Bundle>(
      "mfl",
      `${config.get("mfl:apiUrl")}/bundle/organization`
    );
  }

  async getOrganization(id: string): Promise<fhirR4.Organization> {
    return this.handleApiCall<fhirR4.Organization>(
      "mfl",
      `${config.get("mfl:apiUrl")}/organization/${id}`
    );
  }
}
