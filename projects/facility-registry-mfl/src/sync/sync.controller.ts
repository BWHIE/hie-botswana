import { Controller, Post, Get, HttpStatus, HttpCode } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
} from "@nestjs/swagger";
import { SyncService } from "./sync.service";

/**
 * SyncController provides HTTP endpoints for MFL data synchronization.
 *
 * This controller handles:
 * - Manual sync triggers
 * - Sync status and statistics
 * - Health checks for sync functionality
 */
@ApiTags("sync")
@Controller("sync")
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * Triggers a manual synchronization with MFL API
   */
  @Post("trigger")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Trigger MFL synchronization",
    description:
      "Manually triggers synchronization of locations and organizations with the MFL API",
  })
  @ApiOkResponse({
    description: "Synchronization completed successfully",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        statistics: {
          type: "object",
          properties: {
            totalMFL: { type: "number" },
            totalLocal: { type: "number" },
            newLocations: { type: "number" },
            newOrganizations: { type: "number" },
            updatedLocations: { type: "number" },
            updatedOrganizations: { type: "number" },
            errors: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  })
  async triggerSync() {
    return await this.syncService.syncWithMFL();
  }

  /**
   * Gets current sync status and statistics
   */
  @Get("status")
  @ApiOperation({
    summary: "Get sync status",
    description: "Retrieves current synchronization status and statistics",
  })
  @ApiOkResponse({
    description: "Sync status retrieved successfully",
    schema: {
      type: "object",
      properties: {
        lastSync: { type: "string", format: "date-time" },
        localCounts: {
          type: "object",
          properties: {
            locations: { type: "number" },
            organizations: { type: "number" },
          },
        },
        mflCounts: {
          type: "object",
          properties: {
            locations: { type: "number" },
            organizations: { type: "number" },
          },
        },
      },
    },
  })
  async getSyncStatus() {
    return await this.syncService.getSyncStatus();
  }

  /**
   * Health check endpoint for sync functionality
   */
  @Get("health")
  @ApiOperation({
    summary: "Sync health check",
    description: "Checks if sync functionality is working properly",
  })
  @ApiOkResponse({
    description: "Sync service is healthy",
    schema: {
      type: "object",
      properties: {
        status: { type: "string" },
        timestamp: { type: "string", format: "date-time" },
        mflApiAccessible: { type: "boolean" },
      },
    },
  })
  async healthCheck() {
    try {
      const status = await this.syncService.getSyncStatus();
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        mflApiAccessible:
          status.mflCounts.locations > 0 || status.mflCounts.organizations > 0,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        mflApiAccessible: false,
        error: error.message,
      };
    }
  }
}
