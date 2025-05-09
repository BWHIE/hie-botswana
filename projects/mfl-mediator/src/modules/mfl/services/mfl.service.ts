import { Injectable, Logger } from "@nestjs/common";
import config from "../../../config";
import { fhirR4 } from "@smile-cdr/fhirts";
import { ApiService } from "./api.service";
import { ApiError } from "../errors/api.error";

@Injectable()
export class MflService {
  private readonly logger = new Logger(MflService.name);

  constructor(
    private readonly apiService: ApiService,
  ) {}

  private async handleApiCall<T>(
    type: string,
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body: any = {}
  ): Promise<T> {
    try {
      const response = await this.apiService.makeRequest<T>(method, url, {
        headers: {
          "Content-Type": "application/json",
        },
        data: body,
      });

      return response;
    } catch (error) {
      this.logger.error(`API call failed for ${type}:`, {
        url,
        error: error instanceof Error ? error.message : "Unknown error",
        status: error instanceof ApiError ? error.statusCode : 500,
        response: error instanceof ApiError ? error.responseData : undefined,
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
