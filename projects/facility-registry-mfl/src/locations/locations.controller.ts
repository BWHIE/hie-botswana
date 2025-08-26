import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { LocationsService, Location } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async getAllLocations(): Promise<Location[]> {
    return this.locationsService.getAllLocations();
  }

  @Get('search')
  async searchLocations(
    @Query('name') name?: string,
    @Query('identifier') identifier?: string,
    @Query('type') type?: string,
  ): Promise<Location[]> {
    const query = name || identifier || '';
    return this.locationsService.searchLocations(query, type);
  }

  @Get(':identifier')
  async getLocationByIdentifier(@Param('identifier') identifier: string): Promise<Location> {
    const location = await this.locationsService.getLocationByIdentifier(identifier);
    
    if (!location) {
      throw new NotFoundException(`Location with identifier '${identifier}' not found`);
    }
    
    return location;
  }
}
