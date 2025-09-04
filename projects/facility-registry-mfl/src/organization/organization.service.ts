import { Injectable, OnModuleInit } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

/**
 * Represents an organization in the facility registry system.
 *
 * This interface defines the structure of organization data used throughout
 * the application. It follows FHIR Organization resource standards and includes
 * all necessary fields for healthcare organization management.
 *
 * @interface Organization
 */
export interface Organization {
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  active: boolean;
  name: string;
  alias?: string[];
  type?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  telecom?: Array<{
    system: string;
    value: string;
    use?: string;
  }>;
  address?: Array<{
    text?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  contact?: Array<{
    purpose?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    name?: {
      text?: string;
      family?: string;
      given?: string[];
    };
    telecom?: Array<{
      system: string;
      value: string;
      use?: string;
    }>;
  }>;
  partOf?: {
    reference: string;
  };
}

/**
 * OrganizationService provides business logic for organization-related operations.
 *
 * This service manages organization data loaded from a JSON configuration file
 * and provides methods for retrieving, searching, and querying organizations.
 * It implements the OnModuleInit interface to load organization data when the
 * module is initialized.
 *
 * @example
 * ```typescript
 * // Inject the service
 * constructor(private readonly organizationService: OrganizationService) {}
 *
 * // Get all organizations
 * const organizations = await this.organizationService.getAllOrganizations();
 *
 * // Search for organizations
 * const results = await this.organizationService.searchOrganizations('Ministry', 'government', true);
 * ```
 */
@Injectable()
export class OrganizationService implements OnModuleInit {
  private organizations: Organization[] = [];
  private readonly dataPath = path.join(
    process.cwd(),
    "config",
    "organizations.json"
  );

  /**
   * Initializes the service when the module is loaded.
   *
   * This method is called automatically by NestJS when the module is initialized.
   * It triggers the loading of organization data from the configuration file.
   *
   * @returns {Promise<void>} A promise that resolves when initialization is complete
   */
  async onModuleInit() {
    await this.loadOrganizations();
  }

  /**
   * Loads organization data from the configuration file.
   *
   * This private method reads the organizations.json file from the config directory
   * and parses it into the in-memory organizations array. If the file cannot be
   * read or parsed, it logs an error and initializes an empty array.
   *
   * @returns {Promise<void>} A promise that resolves when loading is complete
   *
   * @example
   * ```typescript
   * // This method is called automatically during module initialization
   * // It loads data from config/organizations.json
   * ```
   *
   * @throws {Error} When the data file cannot be read or parsed (handled internally)
   */
  private async loadOrganizations(): Promise<void> {
    try {
      const data = fs.readFileSync(this.dataPath, "utf8");
      this.organizations = JSON.parse(data);
      console.log(
        `Loaded ${this.organizations.length} organizations from data file`
      );
    } catch (error) {
      console.error("Error loading organizations data:", error);
      this.organizations = [];
    }
  }

  /**
   * Retrieves all available organizations.
   *
   * This method returns a copy of all organizations currently loaded in memory.
   * The organizations are loaded from the configuration file during service initialization.
   *
   * @returns {Promise<Organization[]>} A promise that resolves to an array of all Organization objects
   *
   * @example
   * ```typescript
   * const allOrganizations = await this.organizationService.getAllOrganizations();
   * console.log(`Found ${allOrganizations.length} organizations`);
   * ```
   */
  async getAllOrganizations(): Promise<Organization[]> {
    return this.organizations;
  }

  /**
   * Finds an organization by its identifier using multiple search strategies.
   *
   * This method implements a cascading search approach:
   * 1. First attempts exact ID match
   * 2. Then searches by identifier value
   * 3. Finally performs partial name matching (case-insensitive)
   *
   * @param {string} identifier - The identifier to search for (ID, identifier value, or partial name)
   *
   * @returns {Promise<Organization | null>} A promise that resolves to the matching Organization object or null if not found
   *
   * @example
   * ```typescript
   * // Search by exact ID
   * const organization = await this.organizationService.getOrganizationByIdentifier('ORG001');
   *
   * // Search by identifier value
   * const organization = await this.organizationService.getOrganizationByIdentifier('12345');
   *
   * // Search by partial name
   * const organization = await this.organizationService.getOrganizationByIdentifier('Ministry');
   * ```
   */
  async getOrganizationByIdentifier(
    identifier: string
  ): Promise<Organization | null> {
    let organization = this.organizations.find((org) => org.id === identifier);

    if (!organization) {
      organization = this.organizations.find((org) =>
        org.identifier?.some((id) => id.value === identifier)
      );
    }

    if (!organization) {
      organization = this.organizations.find((org) =>
        org.name?.toLowerCase().includes(identifier.toLowerCase())
      );
    }

    return organization || null;
  }

  /**
   * Searches for organizations based on query string, type filter, and active status.
   *
   * This method performs a flexible search across multiple organization fields:
   * - Name (partial match, case-insensitive)
   * - Alias (partial match, case-insensitive)
   * - Identifier values (partial match, case-insensitive)
   * - Type display names and codes (when type filter is provided)
   * - Active status (when active filter is provided)
   *
   * @param {string} [query] - The search query string (can be empty to return all organizations)
   * @param {string} [type] - Optional type filter for additional filtering
   * @param {boolean} [active] - Optional active status filter
   *
   * @returns {Promise<Organization[]>} A promise that resolves to an array of matching Organization objects
   *
   * @example
   * ```typescript
   * // Search by name
   * const results = await this.organizationService.searchOrganizations('Ministry');
   *
   * // Search by identifier
   * const results = await this.organizationService.searchOrganizations('ORG001');
   *
   * // Search with type filter
   * const results = await this.organizationService.searchOrganizations('Health', 'government');
   *
   * // Search with active status filter
   * const results = await this.organizationService.searchOrganizations('', 'government', true);
   *
   * // Get all organizations (empty query)
   * const allOrganizations = await this.organizationService.searchOrganizations('');
   * ```
   */
  async searchOrganizations(
    query?: string,
    type?: string,
    active?: boolean
  ): Promise<Organization[]> {
    let results = this.organizations;

    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(
        (org) =>
          org.name?.toLowerCase().includes(queryLower) ||
          org.alias?.some((alias) =>
            alias.toLowerCase().includes(queryLower)
          ) ||
          org.identifier?.some((id) =>
            id.value.toLowerCase().includes(queryLower)
          )
      );
    }

    if (type) {
      const typeLower = type.toLowerCase();
      results = results.filter((org) =>
        org.type?.some((t) =>
          t.coding?.some(
            (coding) =>
              coding.display.toLowerCase().includes(typeLower) ||
              coding.code.toLowerCase().includes(typeLower)
          )
        )
      );
    }

    if (active !== undefined) {
      results = results.filter((org) => org.active === active);
    }

    return results;
  }

  /**
   * Returns the total count of organizations currently loaded in memory.
   *
   * This method provides a quick way to get the number of organizations
   * without retrieving the entire dataset. Useful for pagination,
   * statistics, and monitoring purposes.
   *
   * @returns {Promise<number>} A promise that resolves to the total number of organizations
   *
   * @example
   * ```typescript
   * const count = await this.organizationService.getOrganizationsCount();
   * console.log(`Total organizations: ${count}`);
   *
   * // Use for pagination
   * const totalPages = Math.ceil(count / pageSize);
   * ```
   */
  async getOrganizationsCount(): Promise<number> {
    return this.organizations.length;
  }
}
