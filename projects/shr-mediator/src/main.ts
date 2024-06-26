import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import config from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kafka setup
  const brokers = config.get('taskRunner:brokers') || ['kafka:9092'];

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: brokers,
      },
    },
  });

  await app.startAllMicroservices();
  
  await app.listen(3000);
}
bootstrap();
