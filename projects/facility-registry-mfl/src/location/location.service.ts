import { Injectable, OnModuleInit } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { Location } from "../common/interfaces";

/**
 * LocationService provides business logic for location-related operations.
 *
 * This service manages location data loaded from a JSON configuration file
 * and provides methods for retrieving, searching, and querying locations.
 * It implements the OnModuleInit interface to load location data when the
 * module is initialized.
 *
 * @example
 * ```typescript
 * // Inject the service
 * constructor(private readonly locationService: LocationService) {}
 *
 * // Get all locations
 * const locations = await this.locationService.getAllLocations();
 *
 * // Search for locations
 * const results = await this.locationService.searchLocation('hospital', 'clinic');
 * ```
 */
@Injectable()
export class LocationService implements OnModuleInit {
  private locations: Location[] = [];
  private readonly dataPath = path.join(
    process.cwd(),
    "config",
    "locations.json"
  );

  /**
   * Initializes the service when the module is loaded.
   *
   * This method is called automatically by NestJS when the module is initialized.
   * It triggers the loading of location data from the configuration file.
   *
   * @returns {Promise<void>} A promise that resolves when initialization is complete
   */
  async onModuleInit() {
    await this.loadLocation();
  }

  /**
   * Loads location data from the configuration file.
   *
   * This private method reads the locations.json file from the config directory
   * and parses it into the in-memory locations array. If the file cannot be
   * read or parsed, it logs an error and initializes an empty array.
   *
   * @returns {Promise<void>} A promise that resolves when loading is complete
   *
   * @example
   * ```typescript
   * // This method is called automatically during module initialization
   * // It loads data from config/locations.json
   * ```
   *
   * @throws {Error} When the data file cannot be read or parsed (handled internally)
   */
  private async loadLocation(): Promise<void> {
    try {
      const data = fs.readFileSync(this.dataPath, "utf8");
      this.locations = JSON.parse(data);
      console.log(`Loaded ${this.locations.length} locations from data file`);
    } catch (error) {
      console.error("Error loading location data:", error);
      this.locations = [];
    }
  }

  /**
   * Retrieves all available locations.
   *
   * This method returns a copy of all locations currently loaded in memory.
   * The locations are loaded from the configuration file during service initialization.
   *
   * @returns {Promise<Location[]>} A promise that resolves to an array of all Location objects
   *
   * @example
   * ```typescript
   * const allLocations = await this.locationService.getAllLocations();
   * console.log(`Found ${allLocations.length} locations`);
   * ```
   */
  async getAllLocations(): Promise<Location[]> {
    return this.locations;
  }

  /**
   * Finds a location by its identifier using multiple search strategies.
   *
   * This method implements a cascading search approach:
   * 1. First attempts exact ID match
   * 2. Then searches by identifier value
   * 3. Finally performs partial name matching (case-insensitive)
   *
   * @param {string} identifier - The identifier to search for (ID, identifier value, or partial name)
   *
   * @returns {Promise<Location | null>} A promise that resolves to the matching Location object or null if not found
   *
   * @example
   * ```typescript
   * // Search by exact ID
   * const location = await this.locationService.getLocationByIdentifier('LOC001');
   *
   * // Search by identifier value
   * const location = await this.locationService.getLocationByIdentifier('12345');
   *
   * // Search by partial name
   * const location = await this.locationService.getLocationByIdentifier('Gaborone');
   * ```
   */
  async getLocationByIdentifier(identifier: string): Promise<Location | null> {
    let location = this.locations.find((loc) => loc.id === identifier);

    if (!location) {
      location = this.locations.find((loc) =>
        loc.identifier?.some((id) => id.value === identifier)
      );
    }

    if (!location) {
      location = this.locations.find((loc) =>
        loc.name?.toLowerCase().includes(identifier.toLowerCase())
      );
    }

    return location || null;
  }

  /**
   * Searches for locations based on query string and optional type filter.
   *
   * This method performs a flexible search across multiple location fields:
   * - Name (partial match, case-insensitive)
   * - Identifier values (partial match, case-insensitive)
   * - Description (partial match, case-insensitive)
   * - Type display names and codes (when type filter is provided)
   *
   * @param {string} query - The search query string (can be empty to return all locations)
   * @param {string} [type] - Optional type filter for additional filtering
   *
   * @returns {Promise<Location[]>} A promise that resolves to an array of matching Location objects
   *
   * @example
   * ```typescript
   * // Search by name
   * const results = await this.locationService.searchLocation('hospital');
   *
   * // Search by identifier
   * const results = await this.locationService.searchLocation('LOC001');
   *
   * // Search with type filter
   * const results = await this.locationService.searchLocation('Gaborone', 'clinic');
   *
   * // Get all locations (empty query)
   * const allLocations = await this.locationService.searchLocation('');
   * ```
   */
  async searchLocation(query: string, type?: string): Promise<Location[]> {
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

  /**
   * Returns the total count of locations currently loaded in memory.
   *
   * This method provides a quick way to get the number of locations
   * without retrieving the entire dataset. Useful for pagination,
   * statistics, and monitoring purposes.
   *
   * @returns {Promise<number>} A promise that resolves to the total number of locations
   *
   * @example
   * ```typescript
   * const count = await this.locationService.getLocationsCount();
   * console.log(`Total locations: ${count}`);
   *
   * // Use for pagination
   * const totalPages = Math.ceil(count / pageSize);
   * ```
   */
  async getLocationsCount(): Promise<number> {
    return this.locations.length;
  }
}
