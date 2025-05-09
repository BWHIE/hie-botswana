import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import config from "./config";
import * as bodyParser from "body-parser";
import { FhirExceptionFilter } from "./middlewares/fhir-exception.filter";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  // Enable CORS
  app.enableCors();

  // Apply global filters
  app.useGlobalFilters(new FhirExceptionFilter());

  // Configure body parser
  const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || "utf8");
    }
  };
  app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
  app.use(bodyParser.json({ verify: rawBodyBuffer }));

  // Get the port from config
  const port = config.get("app.port") || 3000;
  logger.log(`Starting application on port ${port}`);

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
