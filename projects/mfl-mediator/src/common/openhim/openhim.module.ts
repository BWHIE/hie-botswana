import { Module } from "@nestjs/common";
import { OpenhimService } from "./openhim.service";
import { ConfigModule } from "@nestjs/config";
import { TransactionService } from "./transaction/transaction.service";
import { OpenhimRegistrationService } from "./openhim-registration.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [OpenhimService, TransactionService, OpenhimRegistrationService],
  exports: [OpenhimService, TransactionService, OpenhimRegistrationService],
})
export class OpenhimModule {}
