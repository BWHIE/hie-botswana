import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { MflService } from "./services/mfl.service";
import { MflController } from "./controllers/mfl.controller";
import { TransactionModule } from "../transaction/transaction.module";

@Module({
  imports: [HttpModule, ConfigModule, TransactionModule],
  controllers: [MflController],
  providers: [MflService],
})
export class MflModule {}
