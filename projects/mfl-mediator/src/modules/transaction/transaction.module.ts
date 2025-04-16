import { Module } from "@nestjs/common";
import { TransactionService } from "./services/transaction.service";

@Module({
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
