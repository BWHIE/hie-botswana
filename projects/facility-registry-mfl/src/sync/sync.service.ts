import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import * as fs from "fs";
import * as path from "path";
import { LocationService } from "../location/location.service";
import { OrganizationService } from "../organization/organization.service";
import { Location, Organization } from "../common/interfaces";

interface MFLBundleResponse {
  resourceType: string;
  type: string;
  timestamp: string;
  entry: Array<{
    fullUrl: string;
    resource: Location | Organization;
  }>;
}

export interface SyncResult {
  success: boolean;
  message: string;
  statistics: {
    totalMFL: number;
    totalLocal: number;
    newLocations: number;
    newOrganizations: number;
    updatedLocations: number;
    updatedOrganizations: number;
    failedLocations: number;
    failedOrganizations: number;
    errors: string[];
  };
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly mflBaseUrl = "https://mfldit.gov.org.bw/api/v1/mfl/fhir";
  private readonly dataPath = path.join(process.cwd(), "config");

  constructor(
    private readonly httpService: HttpService,
    private readonly locationService: LocationService,
    private readonly organizationService: OrganizationService
  ) {}

  /**
   * Synchronizes locations and organizations with MFL API
   */
  async syncWithMFL(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      message: "",
      statistics: {
        totalMFL: 0,
        totalLocal: 0,
        newLocations: 0,
        newOrganizations: 0,
        updatedLocations: 0,
        updatedOrganizations: 0,
        failedLocations: 0,
        failedOrganizations: 0,
        errors: [],
      },
    };

    try {
      this.logger.log("Starting MFL synchronization...");

      // Get current local data
      const localLocations = await this.locationService.getAllLocations();
      const localOrganizations =
        await this.organizationService.getAllOrganizations();
      result.statistics.totalLocal =
        localLocations.length + localOrganizations.length;

      // Get MFL resource IDs from bundle endpoints
      const [mflLocationIds, mflOrganizationIds] = await Promise.all([
        this.getMFLResourceIds("location"),
        this.getMFLResourceIds("organization"),
      ]);

      result.statistics.totalMFL =
        mflLocationIds.length + mflOrganizationIds.length;

      // Process locations - find missing and fetch full details
      const locationResult = await this.processLocationsDetailed(
        mflLocationIds,
        localLocations
      );
      result.statistics.newLocations = locationResult.newCount;
      result.statistics.updatedLocations = locationResult.updatedCount;
      result.statistics.failedLocations = locationResult.failedCount;

      // Process organizations - find missing and fetch full details
      const organizationResult = await this.processOrganizationsDetailed(
        mflOrganizationIds,
        localOrganizations
      );
      result.statistics.newOrganizations = organizationResult.newCount;
      result.statistics.updatedOrganizations = organizationResult.updatedCount;
      result.statistics.failedOrganizations = organizationResult.failedCount;

      result.success = true;
      const failedTotal =
        result.statistics.failedLocations +
        result.statistics.failedOrganizations;
      if (failedTotal > 0) {
        result.message = `Sync completed with ${failedTotal} failures. Added ${result.statistics.newLocations} new locations and ${result.statistics.newOrganizations} new organizations. Failed: ${result.statistics.failedLocations} locations, ${result.statistics.failedOrganizations} organizations.`;
      } else {
        result.message = `Sync completed successfully. Added ${result.statistics.newLocations} new locations and ${result.statistics.newOrganizations} new organizations.`;
      }

      this.logger.log("MFL synchronization completed successfully");
    } catch (error) {
      this.logger.error("MFL synchronization failed:", error);
      result.message = `Sync failed: ${error.message}`;
      result.statistics.errors.push(error.message);
    }

    return result;
  }

  /**
   * Gets resource IDs from MFL bundle endpoint
   */
  private async getMFLResourceIds(
    resourceType: "location" | "organization"
  ): Promise<string[]> {
    try {
      const url = `${this.mflBaseUrl}/bundle/${resourceType}`;
      this.logger.log(`Fetching ${resourceType} IDs from: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get<MFLBundleResponse>(url)
      );

      const ids = response.data.entry.map((entry) => entry.resource.id);
      this.logger.log(`Successfully fetched ${ids.length} ${resourceType} IDs`);
      return ids;
    } catch (error) {
      this.logger.error(`Failed to fetch ${resourceType} IDs:`, error);
      throw new Error(`Failed to fetch ${resourceType} IDs: ${error.message}`);
    }
  }

  /**
   * Fetches full resource details from MFL API with retry logic
   */
  private async fetchMFLResourceDetails(
    resourceType: "location" | "organization",
    id: string,
    retryCount: number = 0
  ): Promise<Location | Organization> {
    const maxRetries = 2;
    const retryDelay = 1000; // 1 second

    try {
      const url = `${this.mflBaseUrl}/${resourceType}/${id}`;
      this.logger.log(
        `Fetching ${resourceType} details from: ${url}${retryCount > 0 ? ` (retry ${retryCount})` : ""}`
      );

      const response = await firstValueFrom(
        this.httpService.get<Location | Organization>(url)
      );

      return response.data;
    } catch (error) {
      const isRetryableError =
        error.response?.status >= 500 ||
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT";

      if (isRetryableError && retryCount < maxRetries) {
        this.logger.warn(
          `Retrying fetch for ${resourceType} ${id} in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return this.fetchMFLResourceDetails(resourceType, id, retryCount + 1);
      }

      // Log different error types with appropriate levels
      if (error.response?.status === 404) {
        this.logger.warn(
          `${resourceType} ${id} not found (404) - may have been deleted`
        );
      } else if (error.response?.status === 500) {
        this.logger.error(
          `${resourceType} ${id} server error (500) - MFL API issue`
        );
      } else {
        this.logger.error(`Failed to fetch ${resourceType} ${id}:`, error);
      }

      throw new Error(
        `Failed to fetch ${resourceType} ${id}: ${error.message}`
      );
    }
  }

  /**
   * Fetches data from MFL API (legacy method - kept for compatibility)
   */
  private async fetchMFLData(
    resourceType: "location" | "organization"
  ): Promise<MFLBundleResponse> {
    try {
      const url = `${this.mflBaseUrl}/bundle/${resourceType}`;
      this.logger.log(`Fetching ${resourceType} data from: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get<MFLBundleResponse>(url)
      );

      this.logger.log(
        `Successfully fetched ${response.data.entry.length} ${resourceType} entries`
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch ${resourceType} data:`, error);
      throw new Error(`Failed to fetch ${resourceType} data: ${error.message}`);
    }
  }

  /**
   * Processes locations with detailed fetching for missing records
   */
  private async processLocationsDetailed(
    mflLocationIds: string[],
    localLocations: Location[]
  ): Promise<{ newCount: number; updatedCount: number; failedCount: number }> {
    const newLocations: Location[] = [];
    const updatedLocations: Location[] = [];
    let failedCount = 0;

    // Create a map using identifier values for duplicate checking
    const localLocationMap = new Map<string, Location>();
    localLocations.forEach((loc) => {
      if (loc.identifier && Array.isArray(loc.identifier)) {
        loc.identifier.forEach((id) => {
          if (id && id.value) {
            localLocationMap.set(id.value, loc);
          }
        });
      }
    });

    // Find missing location IDs
    const missingLocationIds = mflLocationIds.filter(
      (id) => !localLocationMap.has(id)
    );

    this.logger.log(
      `Found ${missingLocationIds.length} missing locations out of ${mflLocationIds.length} total`
    );

    // Fetch full details for missing locations
    for (const id of missingLocationIds) {
      try {
        const fullLocation = await this.fetchMFLResourceDetails("location", id);

        // Check if this location already exists by identifier before adding
        const existsByIdentifier = this.locationExistsByIdentifier(
          fullLocation as Location,
          localLocationMap
        );
        if (!existsByIdentifier) {
          newLocations.push(fullLocation as Location);
          // Add to map for subsequent checks
          if (
            (fullLocation as Location).identifier &&
            Array.isArray((fullLocation as Location).identifier)
          ) {
            (fullLocation as Location).identifier.forEach((id) => {
              if (id && id.value) {
                localLocationMap.set(id.value, fullLocation as Location);
              }
            });
          }
        }

        // Add a small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(`Failed to fetch location ${id}:`, error);
        failedCount++;
        // Continue with other locations even if one fails
      }
    }

    // Update local data file if we have new locations
    if (newLocations.length > 0) {
      const allLocations = [...localLocations, ...newLocations];
      await this.saveLocations(allLocations);
      this.logger.log(
        `Added ${newLocations.length} new locations with full details`
      );
    }

    return {
      newCount: newLocations.length,
      updatedCount: updatedLocations.length,
      failedCount: failedCount,
    };
  }

  /**
   * Processes locations and updates local data (legacy method)
   */
  private async processLocations(
    mflData: MFLBundleResponse,
    localLocations: Location[]
  ): Promise<{ newCount: number; updatedCount: number }> {
    const newLocations: Location[] = [];
    const updatedLocations: Location[] = [];

    // Create a map using identifier values for duplicate checking
    const localLocationMap = new Map<string, Location>();
    localLocations.forEach((loc) => {
      if (loc.identifier && Array.isArray(loc.identifier)) {
        loc.identifier.forEach((id) => {
          if (id && id.value) {
            localLocationMap.set(id.value, loc);
          }
        });
      }
    });

    for (const entry of mflData.entry) {
      const mflLocation = entry.resource as Location;

      // Check if location exists by identifier
      const existsByIdentifier = this.locationExistsByIdentifier(
        mflLocation,
        localLocationMap
      );

      if (existsByIdentifier) {
        // Find the existing location and check if it needs updating
        const existingLocation = localLocations.find((loc) => {
          if (
            !loc.identifier ||
            !Array.isArray(loc.identifier) ||
            !mflLocation.identifier ||
            !Array.isArray(mflLocation.identifier)
          ) {
            return false;
          }
          return loc.identifier.some(
            (id) =>
              id &&
              id.value &&
              mflLocation.identifier.some(
                (mflId) => mflId && mflId.value === id.value
              )
          );
        });

        if (
          existingLocation &&
          this.hasLocationChanged(existingLocation, mflLocation)
        ) {
          updatedLocations.push(mflLocation);
        }
      } else {
        // New location
        newLocations.push(mflLocation);
      }
    }

    // Update local data file
    if (newLocations.length > 0 || updatedLocations.length > 0) {
      const allLocations = [...localLocations];

      // Add new locations
      allLocations.push(...newLocations);

      // Update existing locations
      updatedLocations.forEach((updatedLocation) => {
        const index = allLocations.findIndex((loc) => {
          if (
            !loc.identifier ||
            !Array.isArray(loc.identifier) ||
            !updatedLocation.identifier ||
            !Array.isArray(updatedLocation.identifier)
          ) {
            return false;
          }
          return loc.identifier.some(
            (id) =>
              id &&
              id.value &&
              updatedLocation.identifier.some(
                (updId) => updId && updId.value === id.value
              )
          );
        });
        if (index !== -1) {
          allLocations[index] = updatedLocation;
        }
      });

      await this.saveLocations(allLocations);
      this.logger.log(
        `Updated locations: ${newLocations.length} new, ${updatedLocations.length} updated`
      );
    }

    return {
      newCount: newLocations.length,
      updatedCount: updatedLocations.length,
    };
  }

  /**
   * Processes organizations with detailed fetching for missing records
   */
  private async processOrganizationsDetailed(
    mflOrganizationIds: string[],
    localOrganizations: Organization[]
  ): Promise<{ newCount: number; updatedCount: number; failedCount: number }> {
    const newOrganizations: Organization[] = [];
    const updatedOrganizations: Organization[] = [];
    let failedCount = 0;

    // Create a map using identifier values for duplicate checking
    const localOrganizationMap = new Map<string, Organization>();
    localOrganizations.forEach((org) => {
      if (org.identifier && Array.isArray(org.identifier)) {
        org.identifier.forEach((id) => {
          if (id && id.value) {
            localOrganizationMap.set(id.value, org);
          }
        });
      }
    });

    // Find missing organization IDs
    const missingOrganizationIds = mflOrganizationIds.filter(
      (id) => !localOrganizationMap.has(id)
    );

    this.logger.log(
      `Found ${missingOrganizationIds.length} missing organizations out of ${mflOrganizationIds.length} total`
    );

    // Fetch full details for missing organizations
    for (const id of missingOrganizationIds) {
      try {
        const fullOrganization = await this.fetchMFLResourceDetails(
          "organization",
          id
        );

        // Check if this organization already exists by identifier before adding
        const existsByIdentifier = this.organizationExistsByIdentifier(
          fullOrganization as Organization,
          localOrganizationMap
        );
        if (!existsByIdentifier) {
          newOrganizations.push(fullOrganization as Organization);
          // Add to map for subsequent checks
          if (
            (fullOrganization as Organization).identifier &&
            Array.isArray((fullOrganization as Organization).identifier)
          ) {
            (fullOrganization as Organization).identifier.forEach((id) => {
              if (id && id.value) {
                localOrganizationMap.set(
                  id.value,
                  fullOrganization as Organization
                );
              }
            });
          }
        }

        // Add a small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(`Failed to fetch organization ${id}:`, error);
        failedCount++;
        // Continue with other organizations even if one fails
      }
    }

    // Update local data file if we have new organizations
    if (newOrganizations.length > 0) {
      const allOrganizations = [...localOrganizations, ...newOrganizations];
      await this.saveOrganizations(allOrganizations);
      this.logger.log(
        `Added ${newOrganizations.length} new organizations with full details`
      );
    }

    return {
      newCount: newOrganizations.length,
      updatedCount: updatedOrganizations.length,
      failedCount: failedCount,
    };
  }

  /**
   * Processes organizations and updates local data (legacy method)
   */
  private async processOrganizations(
    mflData: MFLBundleResponse,
    localOrganizations: Organization[]
  ): Promise<{ newCount: number; updatedCount: number }> {
    const newOrganizations: Organization[] = [];
    const updatedOrganizations: Organization[] = [];

    // Create a map using identifier values for duplicate checking
    const localOrganizationMap = new Map<string, Organization>();
    localOrganizations.forEach((org) => {
      if (org.identifier && Array.isArray(org.identifier)) {
        org.identifier.forEach((id) => {
          if (id && id.value) {
            localOrganizationMap.set(id.value, org);
          }
        });
      }
    });

    for (const entry of mflData.entry) {
      const mflOrganization = entry.resource as Organization;

      // Check if organization exists by identifier
      const existsByIdentifier = this.organizationExistsByIdentifier(
        mflOrganization,
        localOrganizationMap
      );

      if (existsByIdentifier) {
        // Find the existing organization and check if it needs updating
        const existingOrganization = localOrganizations.find((org) => {
          if (
            !org.identifier ||
            !Array.isArray(org.identifier) ||
            !mflOrganization.identifier ||
            !Array.isArray(mflOrganization.identifier)
          ) {
            return false;
          }
          return org.identifier.some(
            (id) =>
              id &&
              id.value &&
              mflOrganization.identifier.some(
                (mflId) => mflId && mflId.value === id.value
              )
          );
        });

        if (
          existingOrganization &&
          this.hasOrganizationChanged(existingOrganization, mflOrganization)
        ) {
          updatedOrganizations.push(mflOrganization);
        }
      } else {
        // New organization
        newOrganizations.push(mflOrganization);
      }
    }

    // Update local data file
    if (newOrganizations.length > 0 || updatedOrganizations.length > 0) {
      const allOrganizations = [...localOrganizations];

      // Add new organizations
      allOrganizations.push(...newOrganizations);

      // Update existing organizations
      updatedOrganizations.forEach((updatedOrganization) => {
        const index = allOrganizations.findIndex((org) => {
          if (
            !org.identifier ||
            !Array.isArray(org.identifier) ||
            !updatedOrganization.identifier ||
            !Array.isArray(updatedOrganization.identifier)
          ) {
            return false;
          }
          return org.identifier.some(
            (id) =>
              id &&
              id.value &&
              updatedOrganization.identifier.some(
                (updId) => updId && updId.value === id.value
              )
          );
        });
        if (index !== -1) {
          allOrganizations[index] = updatedOrganization;
        }
      });

      await this.saveOrganizations(allOrganizations);
      this.logger.log(
        `Updated organizations: ${newOrganizations.length} new, ${updatedOrganizations.length} updated`
      );
    }

    return {
      newCount: newOrganizations.length,
      updatedCount: updatedOrganizations.length,
    };
  }

  /**
   * Checks if a location exists by identifier
   */
  private locationExistsByIdentifier(
    location: Location,
    localLocationMap: Map<string, Location>
  ): boolean {
    if (!location.identifier || !Array.isArray(location.identifier)) {
      return false;
    }
    return location.identifier.some(
      (id) => id && id.value && localLocationMap.has(id.value)
    );
  }

  /**
   * Checks if an organization exists by identifier
   */
  private organizationExistsByIdentifier(
    organization: Organization,
    localOrganizationMap: Map<string, Organization>
  ): boolean {
    if (!organization.identifier || !Array.isArray(organization.identifier)) {
      return false;
    }
    return organization.identifier.some(
      (id) => id && id.value && localOrganizationMap.has(id.value)
    );
  }

  /**
   * Checks if a location has changed
   */
  private hasLocationChanged(local: Location, mfl: Location): boolean {
    return JSON.stringify(local) !== JSON.stringify(mfl);
  }

  /**
   * Checks if an organization has changed
   */
  private hasOrganizationChanged(
    local: Organization,
    mfl: Organization
  ): boolean {
    return JSON.stringify(local) !== JSON.stringify(mfl);
  }

  /**
   * Saves locations to local file
   */
  private async saveLocations(locations: Location[]): Promise<void> {
    const filePath = path.join(this.dataPath, "locations.json");
    await fs.promises.writeFile(filePath, JSON.stringify(locations, null, 2));
    this.logger.log(`Saved ${locations.length} locations to ${filePath}`);
  }

  /**
   * Saves organizations to local file
   */
  private async saveOrganizations(
    organizations: Organization[]
  ): Promise<void> {
    const filePath = path.join(this.dataPath, "organizations.json");
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(organizations, null, 2)
    );
    this.logger.log(
      `Saved ${organizations.length} organizations to ${filePath}`
    );
  }

  /**
   * Gets sync status and statistics
   */
  async getSyncStatus(): Promise<{
    lastSync: string;
    localCounts: {
      locations: number;
      organizations: number;
    };
    mflCounts: {
      locations: number;
      organizations: number;
    };
  }> {
    const localLocations = await this.locationService.getAllLocations();
    const localOrganizations =
      await this.organizationService.getAllOrganizations();

    // Try to get MFL counts (without full sync)
    let mflCounts = { locations: 0, organizations: 0 };
    try {
      const [locationsData, organizationsData] = await Promise.all([
        this.fetchMFLData("location"),
        this.fetchMFLData("organization"),
      ]);
      mflCounts = {
        locations: locationsData.entry.length,
        organizations: organizationsData.entry.length,
      };
    } catch (error) {
      this.logger.warn("Could not fetch MFL counts:", error.message);
    }

    return {
      lastSync: new Date().toISOString(),
      localCounts: {
        locations: localLocations.length,
        organizations: localOrganizations.length,
      },
      mflCounts,
    };
  }
}
