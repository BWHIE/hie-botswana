import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { BotswanaModule } from './botswana/botswana.module';
import { OpenHimModule } from './openhim/openhim.module';
import { LoggerModule } from './logger/logger.module';
import { FhirJsonParserMiddleware } from './middlewares/fhir-json-parser.middleware';

@Module({
  imports: [CommonModule, BotswanaModule, OpenHimModule, LoggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(FhirJsonParserMiddleware).forRoutes('*'); // Apply globally, adjust routes as needed
  }
}
