import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiError } from "../errors/api.error";
import config from "../../../config";

@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name);
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(private readonly httpService: HttpService) {}

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors, 5xx server errors, or rate limiting (429)
    return (
      !error.response ||
      error.response.status >= 500 ||
      error.response.status === 429
    );
  }

  async makeRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    options: {
      headers?: Record<string, string>;
      data?: any;
      timeout?: number;
    } = {}
  ): Promise<T> {
    let lastError: any;
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        const response = await firstValueFrom(
          this.httpService.request<T>({
            method,
            url,
            headers: options.headers,
            data: options.data,
            timeout: options.timeout || config.get("mfl:timeout"),
          })
        );

        return response.data;
      } catch (error) {
        lastError = error;
        this.logger.error(
          `API request failed (attempt ${attempt + 1}/${this.maxRetries}):`,
          {
            url,
            method,
            error: error.message,
            status: error.response?.status,
            response: error.response?.data,
          }
        );

        if (!this.isRetryableError(error) || attempt === this.maxRetries - 1) {
          throw ApiError.fromAxiosError(error);
        }

        attempt++;
        await this.sleep(this.retryDelay * attempt); // Exponential backoff
      }
    }

    throw ApiError.fromAxiosError(lastError);
  }
}
