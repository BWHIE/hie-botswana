import { Module } from "@nestjs/common";
import { LocationController } from "./location.controller";
import { LocationService } from "./location.service";

/**
 * LocationModule provides location-related functionality for the facility registry.
 *
 * This module encapsulates all location-related components including the controller
 * for handling HTTP requests and the service for business logic. It exports the
 * LocationService to make it available for dependency injection in other modules.
 *
 * The module is responsible for:
 * - Managing location data operations
 * - Providing REST API endpoints for location queries
 * - Loading location data from configuration files
 * - Enabling location services for other modules
 *
 * @example
 * ```typescript
 * // Import the module in your application
 * import { LocationModule } from './location/location.module';
 *
 * @Module({
 *   imports: [LocationModule],
 *   // ... other module configuration
 * })
 * export class AppModule {}
 *
 * // Use the service in other modules
 * constructor(private readonly locationService: LocationService) {}
 * ```
 */
@Module({
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
