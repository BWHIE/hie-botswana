import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { SyncService } from "./sync.service";
import { SyncController } from "./sync.controller";
import { LocationModule } from "../location/location.module";
import { OrganizationModule } from "../organization/organization.module";

/**
 * SyncModule handles synchronization of facility data with external MFL API.
 *
 * This module provides functionality to:
 * - Fetch data from the MFL API
 * - Compare with local data
 * - Identify missing locations and organizations
 * - Update local data files
 * - Provide sync status and statistics
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    LocationModule,
    OrganizationModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
