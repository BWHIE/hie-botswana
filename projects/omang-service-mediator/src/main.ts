import { Mediator } from './mediator/mediator';

async function bootstrap() {
  try {
    const mediator = new Mediator();
    mediator.start(() =>
      console.log(` Server is running, Mediator registered successfully }`),
    );
  } catch (error) {
    console.log('Could not start  Mediator! ' + error);
  }
}
bootstrap();
