import { Mediator } from "./mediator/mediator";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";


async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  try {
    const mediator = new Mediator()
    mediator.start(() =>
      console.log(` Server is running, Mediator registered successfully }`),
    )
  } catch (error) {
    console.log('Could not start  Mediator! ' + error);
  }
}
bootstrap();