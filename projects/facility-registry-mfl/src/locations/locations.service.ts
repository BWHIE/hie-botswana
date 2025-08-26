import { Injectable, OnModuleInit } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

export interface Location {
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  status: string;
  name: string;
  description?: string;
  type?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  address?: {
    text?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  position?: {
    longitude?: number;
    latitude?: number;
  };
  managingOrganization?: {
    reference: string;
  };
  partOf?: {
    reference: string;
  };
}

@Injectable()
export class LocationsService implements OnModuleInit {
  private locations: Location[] = [];
  private readonly dataPath = path.join(
    process.cwd(),
    "config",
    "locations.json"
  );

  async onModuleInit() {
    await this.loadLocations();
  }

  private async loadLocations(): Promise<void> {
    try {
      const data = fs.readFileSync(this.dataPath, "utf8");
      this.locations = JSON.parse(data);
      console.log(`Loaded ${this.locations.length} locations from data file`);
    } catch (error) {
      console.error("Error loading locations data:", error);
      this.locations = [];
    }
  }

  async getAllLocations(): Promise<Location[]> {
    return this.locations;
  }

  async getLocationByIdentifier(identifier: string): Promise<Location | null> {
    // Try to find by ID first
    let location = this.locations.find((loc) => loc.id === identifier);

    if (!location) {
      // Try to find by identifier value
      location = this.locations.find((loc) =>
        loc.identifier?.some((id) => id.value === identifier)
      );
    }

    if (!location) {
      // Try to find by partial name match
      location = this.locations.find((loc) =>
        loc.name?.toLowerCase().includes(identifier.toLowerCase())
      );
    }

    return location || null;
  }

  async searchLocations(query: string, type?: string): Promise<Location[]> {
    let results = this.locations;

    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(
        (loc) =>
          loc.name?.toLowerCase().includes(queryLower) ||
          loc.identifier?.some((id) =>
            id.value.toLowerCase().includes(queryLower)
          ) ||
          loc.description?.toLowerCase().includes(queryLower)
      );
    }

    if (type) {
      const typeLower = type.toLowerCase();
      results = results.filter((loc) =>
        loc.type?.coding?.some(
          (coding) =>
            coding.display.toLowerCase().includes(typeLower) ||
            coding.code.toLowerCase().includes(typeLower)
        )
      );
    }

    return results;
  }

  async getLocationsCount(): Promise<number> {
    return this.locations.length;
  }
}
