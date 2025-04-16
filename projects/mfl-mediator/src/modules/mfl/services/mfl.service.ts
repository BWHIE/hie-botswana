import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { fhirR4 } from "@smile-cdr/fhirts";
import { TransactionService } from "../../transaction/services/transaction.service";

@Injectable()
export class MflService {
  private readonly logger = new Logger(MflService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService
  ) {
    this.baseUrl = this.configService.get<string>("MFL_API_URL");
  }

  async getLocations(request: any): Promise<fhirR4.Bundle> {
    let transaction;
    try {
      transaction = await this.transactionService.logTransaction(
        request,
        null,
        "Success"
      );

      const response = await firstValueFrom(
        this.httpService.get<fhirR4.Bundle>(`${this.baseUrl}/bundle/location`)
      );

      await this.transactionService.updateTransactionStatus(
        transaction._id,
        "Success"
      );

      return response.data as fhirR4.Bundle;
    } catch (error) {
      this.logger.error("Error fetching locations:", error);

      if (transaction) {
        await this.transactionService.updateTransactionStatus(
          transaction._id,
          "Failed",
          error
        );
      }

      throw error;
    }
  }

  async getOrganizations(request: any): Promise<fhirR4.Bundle> {
    let transaction;
    try {
      transaction = await this.transactionService.logTransaction(
        request,
        null,
        "Success"
      );

      const response = await firstValueFrom(
        this.httpService.get<fhirR4.Bundle>(
          `${this.baseUrl}/bundle/organization`
        )
      );

      await this.transactionService.updateTransactionStatus(
        transaction._id,
        "Success"
      );

      return response.data as fhirR4.Bundle;
    } catch (error) {
      this.logger.error("Error fetching organizations:", error);

      if (transaction) {
        await this.transactionService.updateTransactionStatus(
          transaction._id,
          "Failed",
          error
        );
      }

      throw error;
    }
  }
}
