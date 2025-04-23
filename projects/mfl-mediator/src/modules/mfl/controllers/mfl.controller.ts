import { Controller, Get, Param } from "@nestjs/common";
import { MflService } from "../services/mfl.service";
import { fhirR4 } from "@smile-cdr/fhirts";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("MFL")
@Controller("fhir")
export class MflController {
  constructor(private readonly mflService: MflService) {}

  @ApiOperation({ summary: "Get all locations from MFL" })
  @ApiResponse({
    status: 200,
    description: "Returns a FHIR Bundle containing all locations",
    type: fhirR4.Bundle,
  })
  @Get("bundle/location")
  async getLocations(): Promise<fhirR4.Bundle> {
    return this.mflService.getLocations();
  }

  @ApiOperation({ summary: "Get a specific location from MFL" })
  @ApiResponse({
    status: 200,
    description: "Returns a FHIR Location",
    type: fhirR4.Location,
  })
  @Get("location/:id")
  async getLocation(@Param("id") id: string): Promise<fhirR4.Location> {
    return this.mflService.getLocation(id);
  }

  @ApiOperation({ summary: "Get all organizations from MFL" })
  @ApiResponse({
    status: 200,
    description: "Returns a FHIR Bundle containing all organizations",
    type: fhirR4.Bundle,
  })
  @Get("bundle/organization")
  async getOrganizations(): Promise<fhirR4.Bundle> {
    return this.mflService.getOrganizations();
  }

  @ApiOperation({ summary: "Get a specific organization from MFL" })
  @ApiResponse({
    status: 200,
    description: "Returns a FHIR Organization",
    type: fhirR4.Organization,
  })
  @Get("organization/:id")
  async getOrganization(@Param("id") id: string): Promise<fhirR4.Organization> {
    return this.mflService.getOrganization(id);
  }
}
