import { Module } from "@nestjs/common";
import { MflService } from "./services/mfl.service";
import { MflController } from "./controllers/mfl.controller";
import { OpenhimModule } from "../../common/openhim/openhim.module";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [HttpModule, ConfigModule, OpenhimModule],
  controllers: [MflController],
  providers: [MflService],
  exports: [MflService],
})
export class MflModule {}
