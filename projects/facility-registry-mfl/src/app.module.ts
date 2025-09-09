import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { LocationModule } from "./location/location.module";
import { OrganizationModule } from "./organization/organization.module";

/**
 * AppModule is the root module of the Facility Registry MFL application.
 *
 * This module serves as the main entry point for the NestJS application and
 * orchestrates all other modules, services, and controllers. It configures
 * global settings, imports feature modules, and provides the core application
 * functionality for the Botswana healthcare facility registry system.
 *
 * The module is responsible for:
 * - Configuring global application settings and environment variables
 * - Importing and organizing feature modules (Location, Organization)
 * - Providing core application services and controllers
 * - Setting up the overall application architecture
 *
 * @example
 * ```typescript
 * // The module is automatically imported by NestJS when the application starts
 * // It can be referenced in main.ts for application bootstrapping
 *
 * import { NestFactory } from '@nestjs/core';
 * import { AppModule } from './app.module';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   await app.listen(3000);
 * }
 * bootstrap();
 * ```
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LocationModule,
    OrganizationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
