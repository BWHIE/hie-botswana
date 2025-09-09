import { Injectable } from "@nestjs/common";

/**
 * AppService provides core application functionality for the Facility Registry MFL API.
 *
 * This service handles basic application operations including welcome messages
 * and health status checks. It serves as the main service for the root application
 * controller and provides essential information about the API and its status.
 *
 * The service is responsible for:
 * - Providing application welcome messages with API information
 * - Generating health status reports for monitoring
 * - Offering basic application metadata and endpoint information
 *
 * @example
 * ```typescript
 * // Inject the service
 * constructor(private readonly appService: AppService) {}
 *
 * // Get welcome message
 * const welcome = this.appService.getHello();
 *
 * // Get health status
 * const health = this.appService.getHealth();
 * ```
 */
@Injectable()
export class AppService {
  /**
   * Returns a welcome message with API information and available endpoints.
   *
   * This method provides comprehensive information about the Facility Registry MFL API
   * including service details, version information, available endpoints, and current
   * timestamp. It's typically used as the root endpoint response to help users
   * understand the API structure and available resources.
   *
   * @returns {object} An object containing API information and endpoint details
   *
   * @example
   * ```typescript
   * const welcome = this.appService.getHello();
   * console.log(welcome.service); // 'Facility Registry MFL API'
   * console.log(welcome.endpoints.location); // '/api/v1/location'
   * ```
   *
   * @example
   * ```typescript
   * // Response structure
   * {
   *   "service": "Facility Registry MFL API",
   *   "version": "1.0.0",
   *   "description": "REST API for accessing organizations and locations data",
   *   "endpoints": {
   *     "location": "/api/v1/location",
   *     "organization": "/api/v1/organization",
   *     "health": "/api/v1/health"
   *   },
   *   "timestamp": "2025-09-03T16:30:00.000Z"
   * }
   * ```
   */
  getHello(): object {
    return {
      service: "Facility Registry MFL API",
      version: "1.0.0",
      description: "REST API for accessing organizations and locations data",
      endpoints: {
        location: "/api/v1/location",
        organization: "/api/v1/organization",
        health: "/api/v1/health",
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Returns the current health status of the application.
   *
   * This method provides essential health information about the application including
   * current status, timestamp, and uptime. It's commonly used by monitoring systems,
   * load balancers, and health check endpoints to determine if the service is
   * operational and ready to handle requests.
   *
   * @returns {object} An object containing health status information
   *
   * @example
   * ```typescript
   * const health = this.appService.getHealth();
   * console.log(health.status); // 'healthy'
   * console.log(health.uptime); // 3600 (seconds)
   * ```
   *
   * @example
   * ```typescript
   * // Response structure
   * {
   *   "status": "healthy",
   *   "timestamp": "2025-09-03T16:30:00.000Z",
   *   "uptime": 3600
   * }
   * ```
   */
  getHealth(): object {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
