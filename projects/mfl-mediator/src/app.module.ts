import { MiddlewareConsumer, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
// import { CommonModule } from "./common/common.module";
import { MflModule } from "./modules/mfl/mfl.module";
import { OpenhimModule } from "./common/openhim/openhim.module";
import { CommonModule } from "./common/common.module";
import { FhirJsonParserMiddleware } from "./middlewares/fhir-json-parser.middleware";
import { LoggerModule } from "./common/logger/logger.module";
// import { LoggerModule } from "./common/logger/logger.module";
// import { FhirJsonParserMiddleware } from "./middlewares/fhir-json-parser.middleware";

@Module({
  imports: [CommonModule, MflModule, OpenhimModule, LoggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(FhirJsonParserMiddleware).exclude("health").forRoutes("*");
  }
}
