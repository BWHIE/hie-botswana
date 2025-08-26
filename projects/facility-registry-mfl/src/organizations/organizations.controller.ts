import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { OrganizationsService, Organization } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async getAllOrganizations(): Promise<Organization[]> {
    return this.organizationsService.getAllOrganizations();
  }

  @Get('search')
  async searchOrganizations(
    @Query('name') name?: string,
    @Query('identifier') identifier?: string,
    @Query('type') type?: string,
    @Query('active') active?: string,
  ): Promise<Organization[]> {
    const query = name || identifier || '';
    const activeBool = active === undefined ? undefined : active === 'true';
    return this.organizationsService.searchOrganizations(query, type, activeBool);
  }

  @Get(':identifier')
  async getOrganizationByIdentifier(@Param('identifier') identifier: string): Promise<Organization> {
    const organization = await this.organizationsService.getOrganizationByIdentifier(identifier);
    
    if (!organization) {
      throw new NotFoundException(`Organization with identifier '${identifier}' not found`);
    }
    
    return organization;
  }
}
