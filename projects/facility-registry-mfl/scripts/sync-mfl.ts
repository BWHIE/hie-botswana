#!/usr/bin/env ts-node

/**
 * MFL Sync CLI Script
 *
 * This script provides a command-line interface for synchronizing
 * facility data with the MFL API. It can be run independently
 * or as part of automated processes.
 *
 * Usage:
 *   npm run sync:mfl
 *   npx ts-node scripts/sync-mfl.ts
 */

import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { SyncService } from "../src/sync/sync.service";

async function runSync() {
  console.log("🏥 MFL Facility Registry Sync Tool");
  console.log("==================================\n");

  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);
    const syncService = app.get(SyncService);

    console.log("📡 Starting synchronization with MFL API...");
    console.log("   API URL: https://mfldit.gov.org.bw/api/v1/mfl/fhir\n");

    // Get current status
    console.log("📊 Current Status:");
    const status = await syncService.getSyncStatus();
    console.log(`   Local Locations: ${status.localCounts.locations}`);
    console.log(`   Local Organizations: ${status.localCounts.organizations}`);
    console.log(`   MFL Locations: ${status.mflCounts.locations}`);
    console.log(`   MFL Organizations: ${status.mflCounts.organizations}\n`);

    // Perform sync
    const result = await syncService.syncWithMFL();

    // Display results
    console.log("✅ Sync Results:");
    console.log(`   Status: ${result.success ? "SUCCESS" : "FAILED"}`);
    console.log(`   Message: ${result.message}`);
    console.log("\n📈 Statistics:");
    console.log(`   Total MFL Records: ${result.statistics.totalMFL}`);
    console.log(`   Total Local Records: ${result.statistics.totalLocal}`);
    console.log(`   New Locations: ${result.statistics.newLocations}`);
    console.log(`   New Organizations: ${result.statistics.newOrganizations}`);
    console.log(`   Updated Locations: ${result.statistics.updatedLocations}`);
    console.log(
      `   Updated Organizations: ${result.statistics.updatedOrganizations}`
    );

    if (result.statistics.errors.length > 0) {
      console.log("\n❌ Errors:");
      result.statistics.errors.forEach((error) => console.log(`   - ${error}`));
    }

    console.log("\n🎉 Sync completed!");

    // Close application
    await app.close();

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("\n💥 Sync failed with error:");
    console.error(error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the sync if this script is executed directly
if (require.main === module) {
  runSync();
}

export { runSync };
