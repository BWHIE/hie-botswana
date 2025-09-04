import { Module } from "@nestjs/common";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";

/**
 * OrganizationModule provides organization-related functionality for the facility registry.
 *
 * This module encapsulates all organization-related components including the controller
 * for handling HTTP requests and the service for business logic. It exports the
 * OrganizationService to make it available for dependency injection in other modules.
 *
 * The module is responsible for:
 * - Managing organization data operations
 * - Providing REST API endpoints for organization queries
 * - Loading organization data from configuration files
 * - Enabling organization services for other modules
 *
 * @example
 * ```typescript
 * // Import the module in your application
 * import { OrganizationModule } from './organization/organization.module';
 *
 * @Module({
 *   imports: [OrganizationModule],
 *   // ... other module configuration
 * })
 * export class AppModule {}
 *
 * // Use the service in other modules
 * constructor(private readonly organizationService: OrganizationService) {}
 * ```
 */
@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
