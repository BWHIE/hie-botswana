import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { OrganizationService } from "./organization.service";
import { Organization } from "../common/interfaces";

/**
 * OrganizationController handles HTTP requests for organization-related operations.
 *
 * This controller provides endpoints to retrieve and search for organizations
 * in the facility registry system. It supports operations like getting all
 * organizations, searching by various criteria, and retrieving specific organizations
 * by their identifiers.
 *
 * @example
 * ```typescript
 * // Get all organizations
 * GET /api/v1/organization
 *
 * // Search organizations
 * GET /api/v1/organization/search?name=Ministry&type=government&active=true
 *
 * // Get specific organization
 * GET /api/v1/organization/ORG001
 * ```
 */
@Controller("organization")
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  /**
   * Retrieves all available organizations from the facility registry.
   *
   * This endpoint returns a complete list of all organizations stored in the system.
   * The organizations are loaded from the configuration file during application startup.
   *
   * @returns {Promise<Organization[]>} A promise that resolves to an array of Organization objects
   *
   * @example
   * ```typescript
   * // Request
   * GET /api/v1/organization
   *
   * // Response
   * [
   *   {
   *     "id": "ORG001",
   *     "name": "Ministry of Health",
   *     "active": true,
   *     "identifier": [...],
   *     "type": {...}
   *   }
   * ]
   * ```
   *
   * @throws {Error} When there's an internal server error
   */
  @Get()
  async getAllOrganizations(): Promise<Organization[]> {
    return this.organizationService.getAllOrganizations();
  }

  /**
   * Searches for organizations based on various criteria.
   *
   * This endpoint allows searching for organizations using multiple optional parameters.
   * The search is performed using partial matching and can be combined with type and
   * active status filtering.
   *
   * @param {string} [name] - Search for organizations by name (partial match, case-insensitive)
   * @param {string} [identifier] - Search for organizations by identifier value (partial match)
   * @param {string} [type] - Filter organizations by type (partial match on type display or code)
   * @param {string} [active] - Filter organizations by active status ("true" or "false")
   *
   * @returns {Promise<Organization[]>} A promise that resolves to an array of matching Organization objects
   *
   * @example
   * ```typescript
   * // Search by name
   * GET /api/v1/organization/search?name=Ministry
   *
   * // Search by identifier
   * GET /api/v1/organization/search?identifier=ORG001
   *
   * // Search by type
   * GET /api/v1/organization/search?type=government
   *
   * // Search by active status
   * GET /api/v1/organization/search?active=true
   *
   * // Combined search
   * GET /api/v1/organization/search?name=Health&type=government&active=true
   * ```
   *
   * @throws {Error} When there's an internal server error
   */
  @Get("search")
  async searchOrganizations(
    @Query("name") name?: string,
    @Query("identifier") identifier?: string,
    @Query("type") type?: string,
    @Query("active") active?: string
  ): Promise<Organization[]> {
    const query = name || identifier || "";
    const activeBool = active === undefined ? undefined : active === "true";
    return this.organizationService.searchOrganizations(
      query,
      type,
      activeBool
    );
  }

  /**
   * Retrieves a specific organization by its identifier.
   *
   * This endpoint searches for an organization using multiple strategies:
   * 1. First tries to match by exact ID
   * 2. Then searches by identifier value
   * 3. Finally attempts partial name matching (case-insensitive)
   *
   * @param {string} identifier - The identifier to search for (can be ID, identifier value, or partial name)
   *
   * @returns {Promise<Organization>} A promise that resolves to the matching Organization object
   *
   * @example
   * ```typescript
   * // Search by exact ID
   * GET /api/v1/organization/ORG001
   *
   * // Search by identifier value
   * GET /api/v1/organization/12345
   *
   * // Search by partial name
   * GET /api/v1/organization/Ministry
   *
   * // Response
   * {
   *   "id": "ORG001",
   *   "name": "Ministry of Health",
   *   "active": true,
   *   "identifier": [...],
   *   "type": {...}
   * }
   * ```
   *
   * @throws {NotFoundException} When no organization is found with the given identifier
   * @throws {Error} When there's an internal server error
   */
  @Get(":identifier")
  async getOrganizationByIdentifier(
    @Param("identifier") identifier: string
  ): Promise<Organization> {
    const organization =
      await this.organizationService.getOrganizationByIdentifier(identifier);

    if (!organization) {
      throw new NotFoundException(
        `Organization with identifier '${identifier}' not found`
      );
    }

    return organization;
  }
}
