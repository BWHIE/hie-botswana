import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { LocationService } from "./location.service";
import { Location } from "../common/interfaces";

/**
 * LocationController handles HTTP requests for location-related operations.
 *
 * This controller provides endpoints to retrieve and search for locations
 * in the facility registry system. It supports operations like getting all
 * locations, searching by various criteria, and retrieving specific locations
 * by their identifiers.
 *
 * @example
 * ```typescript
 * // Get all locations
 * GET /api/v1/location
 *
 * // Search locations
 * GET /api/v1/location/search?name=Gaborone&type=hospital
 *
 * // Get specific location
 * GET /api/v1/location/LOC001
 * ```
 */
@Controller("location")
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * Retrieves all available locations from the facility registry.
   *
   * This endpoint returns a complete list of all locations stored in the system.
   * The locations are loaded from the configuration file during application startup.
   *
   * @returns {Promise<Location[]>} A promise that resolves to an array of Location objects
   *
   * @example
   * ```typescript
   * // Request
   * GET /api/v1/location
   *
   * // Response
   * [
   *   {
   *     "id": "LOC001",
   *     "name": "Gaborone Hospital",
   *     "status": "active",
   *     "identifier": [...],
   *     "type": {...}
   *   }
   * ]
   * ```
   *
   * @throws {Error} When there's an internal server error
   */
  @Get()
  async getAllLocations(): Promise<Location[]> {
    return this.locationService.getAllLocations();
  }

  /**
   * Searches for locations based on various criteria.
   *
   * This endpoint allows searching for locations using multiple optional parameters.
   * The search is performed using partial matching and can be combined with type filtering.
   *
   * @param {string} [name] - Search for locations by name (partial match, case-insensitive)
   * @param {string} [identifier] - Search for locations by identifier value (partial match)
   * @param {string} [type] - Filter locations by type (partial match on type display or code)
   *
   * @returns {Promise<Location[]>} A promise that resolves to an array of matching Location objects
   *
   * @example
   * ```typescript
   * // Search by name
   * GET /api/v1/location/search?name=Gaborone
   *
   * // Search by identifier
   * GET /api/v1/location/search?identifier=LOC001
   *
   * // Search by type
   * GET /api/v1/location/search?type=hospital
   *
   * // Combined search
   * GET /api/v1/location/search?name=Gaborone&type=hospital
   * ```
   *
   * @throws {Error} When there's an internal server error
   */
  @Get("search")
  async searchLocations(
    @Query("name") name?: string,
    @Query("identifier") identifier?: string,
    @Query("type") type?: string
  ): Promise<Location[]> {
    const query = name || identifier || "";
    return this.locationService.searchLocation(query, type);
  }

  /**
   * Retrieves a specific location by its identifier.
   *
   * This endpoint searches for a location using multiple strategies:
   * 1. First tries to match by exact ID
   * 2. Then searches by identifier value
   * 3. Finally attempts partial name matching
   *
   * @param {string} identifier - The identifier to search for (can be ID, identifier value, or partial name)
   *
   * @returns {Promise<Location>} A promise that resolves to the matching Location object
   *
   * @example
   * ```typescript
   * // Search by exact ID
   * GET /api/v1/location/LOC001
   *
   * // Search by identifier value
   * GET /api/v1/location/12345
   *
   * // Search by partial name
   * GET /api/v1/location/Gaborone
   *
   * // Response
   * {
   *   "id": "LOC001",
   *   "name": "Gaborone Hospital",
   *   "status": "active",
   *   "identifier": [...],
   *   "type": {...}
   * }
   * ```
   *
   * @throws {NotFoundException} When no location is found with the given identifier
   * @throws {Error} When there's an internal server error
   */
  @Get(":identifier")
  async getLocationByIdentifier(
    @Param("identifier") identifier: string
  ): Promise<Location> {
    const location =
      await this.locationService.getLocationByIdentifier(identifier);

    if (!location) {
      throw new NotFoundException(
        `Location with identifier '${identifier}' not found`
      );
    }

    return location;
  }
}
