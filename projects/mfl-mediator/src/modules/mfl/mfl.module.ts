import { Module } from "@nestjs/common";
import { MflService } from "./services/mfl.service";
import { MflController } from "./controllers/mfl.controller";
import { OpenHimModule } from "../../common/openhim/openhim.module";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { ApiService } from "./services/api.service";

@Module({
  imports: [HttpModule, ConfigModule, OpenHimModule],
  controllers: [MflController],
  providers: [MflService, ApiService],
  exports: [MflService],
})
export class MflModule {}
