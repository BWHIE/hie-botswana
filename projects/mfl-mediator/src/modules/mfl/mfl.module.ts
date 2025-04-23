import { Module } from "@nestjs/common";
import { MflService } from "./services/mfl.service";
import { MflController } from "./controllers/mfl.controller";
import { OpenhimModule } from "../../common/openhim/openhim.module";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { TransactionService } from "../../common/openhim/transaction/transaction.service";
import { ApiService } from "./services/api.service";

@Module({
  imports: [HttpModule, ConfigModule, OpenhimModule],
  controllers: [MflController],
  providers: [MflService, TransactionService, ApiService],
  exports: [MflService],
})
export class MflModule {}
