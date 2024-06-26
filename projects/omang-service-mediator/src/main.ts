import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FhirExceptionFilter } from './utils/fhir-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new FhirExceptionFilter());

  await app.listen(80);
}
bootstrap();
