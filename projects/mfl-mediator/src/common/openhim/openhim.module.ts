import { Module } from "@nestjs/common";
import { OpenhimService } from "./openhim.service";
import { ConfigModule } from "@nestjs/config";
import { TransactionService } from "./transaction/transaction.service";

@Module({
  imports: [ConfigModule],
  providers: [OpenhimService, TransactionService],
  exports: [OpenhimService, TransactionService],
})
export class OpenhimModule {}
