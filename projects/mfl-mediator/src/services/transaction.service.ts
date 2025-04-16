import { Injectable, Logger } from "@nestjs/common";
import { createTransaction, updateTransaction } from "openhim-mediator-utils";

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  async logTransaction(
    request: any,
    response: any,
    status: "Success" | "Failed",
    error?: any
  ) {
    try {
      const transaction = await createTransaction({
        request: {
          path: request.url,
          method: request.method,
          headers: request.headers,
          querystring: request.query,
          body: request.body,
        },
        response: {
          status: response?.status || 500,
          headers: response?.headers || {},
          body: response?.data || {},
        },
        status,
        error: error ? error.message : undefined,
      });

      this.logger.log(`Transaction logged: ${transaction._id}`);
      return transaction;
    } catch (error) {
      this.logger.error("Failed to log transaction:", error);
      throw error;
    }
  }

  async updateTransactionStatus(
    transactionId: string,
    status: "Success" | "Failed",
    error?: any
  ) {
    try {
      await updateTransaction(transactionId, {
        status,
        error: error ? error.message : undefined,
      });
      this.logger.log(`Transaction ${transactionId} updated to ${status}`);
    } catch (error) {
      this.logger.error("Failed to update transaction:", error);
      throw error;
    }
  }
}
