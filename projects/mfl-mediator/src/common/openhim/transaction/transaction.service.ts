import { Injectable, Logger } from "@nestjs/common";
import { OpenhimService } from "../openhim.service";
import {
  ITransaction,
  ITransactionService,
} from "./interfaces/transaction.interface";
import { OpenHIMTransaction } from "../types";

@Injectable()
export class TransactionService implements ITransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private transactions: Map<string, ITransaction> = new Map();

  constructor(private readonly openhimService: OpenhimService) {}

  async createTransaction(
    transaction: Partial<ITransaction>
  ): Promise<ITransaction> {
    try {
      const newTransaction: ITransaction = {
        id: transaction.id || this.generateId(),
        status: transaction.status || "pending",
        type: transaction.type || "mfl",
        request: transaction.request || {
          method: "",
          url: "",
          headers: {},
          body: {},
        },
        response: transaction.response || { status: 0, headers: {}, body: {} },
        metadata: {
          timestamp: new Date().toISOString(),
          duration: 0,
          source: transaction.metadata?.source || "",
          destination: transaction.metadata?.destination || "",
        },
      };

      // Register with OpenHIM
      const openhimTransaction: Partial<OpenHIMTransaction> = {
        status: newTransaction.status,
        request: {
          path: newTransaction.request.url,
          querystring: "",
          headers: newTransaction.request.headers,
          body: JSON.stringify(newTransaction.request.body),
        },
        response: {
          status: newTransaction.response.status,
          headers: newTransaction.response.headers,
          body: JSON.stringify(newTransaction.response.body),
        },
        clientID: "mfl-mediator",
        route: "mfl",
      };

      const openhimResponse =
        await this.openhimService.registerTransaction(openhimTransaction);
      newTransaction.id = openhimResponse.transactionId;

      this.transactions.set(newTransaction.id, newTransaction);
      return newTransaction;
    } catch (error) {
      this.logger.error("Error creating transaction:", error);
      throw error;
    }
  }

  async updateTransaction(
    id: string,
    updates: Partial<ITransaction>
  ): Promise<ITransaction> {
    try {
      const existingTransaction = this.transactions.get(id);
      if (!existingTransaction) {
        throw new Error(`Transaction with id ${id} not found`);
      }

      const updatedTransaction = { ...existingTransaction, ...updates };
      this.transactions.set(id, updatedTransaction);

      // Update OpenHIM
      const openhimUpdates: Partial<OpenHIMTransaction> = {
        status: updatedTransaction.status,
        response: {
          status: updatedTransaction.response.status,
          headers: updatedTransaction.response.headers,
          body: JSON.stringify(updatedTransaction.response.body),
        },
      };

      await this.openhimService.updateTransaction(id, openhimUpdates);
      return updatedTransaction;
    } catch (error) {
      this.logger.error("Error updating transaction:", error);
      throw error;
    }
  }

  async getTransaction(id: string): Promise<ITransaction> {
    try {
      const transaction = this.transactions.get(id);
      if (!transaction) {
        throw new Error(`Transaction with id ${id} not found`);
      }
      return transaction;
    } catch (error) {
      this.logger.error("Error getting transaction:", error);
      throw error;
    }
  }

  async listTransactions(
    filters?: Partial<ITransaction>
  ): Promise<ITransaction[]> {
    try {
      let transactions = Array.from(this.transactions.values());
      if (filters) {
        transactions = transactions.filter((transaction) => {
          return Object.entries(filters).every(([key, value]) => {
            return transaction[key] === value;
          });
        });
      }
      return transactions;
    } catch (error) {
      this.logger.error("Error listing transactions:", error);
      throw error;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
