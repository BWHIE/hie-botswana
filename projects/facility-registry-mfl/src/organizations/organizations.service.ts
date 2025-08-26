import { Injectable, OnModuleInit } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

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

@Injectable()
export class OrganizationsService implements OnModuleInit {
  private organizations: Organization[] = [];
  private readonly dataPath = path.join(
    process.cwd(),
    "config",
    "organizations.json"
  );

  async onModuleInit() {
    await this.loadOrganizations();
  }

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

  async getAllOrganizations(): Promise<Organization[]> {
    return this.organizations;
  }

  async getOrganizationByIdentifier(
    identifier: string
  ): Promise<Organization | null> {
    // Try to find by ID first
    let organization = this.organizations.find((org) => org.id === identifier);

    if (!organization) {
      // Try to find by identifier value
      organization = this.organizations.find((org) =>
        org.identifier?.some((id) => id.value === identifier)
      );
    }

    if (!organization) {
      // Try to find by partial name match
      organization = this.organizations.find((org) =>
        org.name?.toLowerCase().includes(identifier.toLowerCase())
      );
    }

    return organization || null;
  }

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

  async getOrganizationsCount(): Promise<number> {
    return this.organizations.length;
  }
}
