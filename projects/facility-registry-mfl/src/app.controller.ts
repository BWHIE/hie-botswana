import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

/**
 * AppController handles root-level HTTP requests for the facility registry application.
 *
 * This controller provides basic application endpoints including health checks
 * and welcome messages. It serves as the main entry point for the application
 * and provides essential status information.
 *
 * @example
 * ```typescript
 * // Get application welcome message
 * GET /api/v1
 *
 * // Check application health
 * GET /api/v1/health
 * ```
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Returns a welcome message for the facility registry application.
   *
   * This endpoint provides a basic greeting message that confirms the application
   * is running and accessible. It's typically used for initial connectivity tests
   * and as a simple way to verify the API is responding.
   *
   * @returns {object} A promise that resolves to an object containing the welcome message
   *
   * @example
   * ```typescript
   * // Request
   * GET /api/v1
   *
   * // Response
   * {
   *   "message": "Welcome to Facility Registry MFL API",
   *   "version": "1.0.0",
   *   "timestamp": "2025-09-03T16:30:00.000Z"
   * }
   * ```
   */
  @Get()
  getHello(): object {
    return this.appService.getHello();
  }

  /**
   * Returns the health status of the facility registry application.
   *
   * This endpoint provides comprehensive health information about the application
   * including system status, database connectivity, and service availability.
   * It's commonly used by monitoring systems and load balancers to check
   * application health and determine if the service is ready to handle requests.
   *
   * @returns {object} A promise that resolves to an object containing health status information
   *
   * @example
   * ```typescript
   * // Request
   * GET /api/v1/health
   *
   * // Response
   * {
   *   "status": "healthy",
   *   "timestamp": "2025-09-03T16:30:00.000Z",
   *   "uptime": 3600,
   *   "version": "1.0.0",
   *   "services": {
   *     "database": "connected",
   *     "locationService": "ready",
   *     "organizationService": "ready"
   *   }
   * }
   * ```
   */
  @Get("health")
  getHealth(): object {
    return this.appService.getHealth();
  }
}
