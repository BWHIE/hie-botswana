import { Controller, Get, Req } from "@nestjs/common";
import { MflService } from "../services/mfl.service";
import { fhirR4 } from "@smile-cdr/fhirts";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";

@ApiTags("MFL")
@Controller("mfl")
export class MflController {
  constructor(private readonly mflService: MflService) {}

  @ApiOperation({ summary: "Get all locations from MFL" })
  @ApiResponse({
    status: 200,
    description: "Returns a FHIR Bundle containing all locations",
    type: fhirR4.Bundle,
  })
  @Get("locations")
  async getLocations(@Req() request: Request): Promise<fhirR4.Bundle> {
    return this.mflService.getLocations(request);
  }

  @ApiOperation({ summary: "Get all organizations from MFL" })
  @ApiResponse({
    status: 200,
    description: "Returns a FHIR Bundle containing all organizations",
    type: fhirR4.Bundle,
  })
  @Get("organizations")
  async getOrganizations(@Req() request: Request): Promise<fhirR4.Bundle> {
    return this.mflService.getOrganizations(request);
  }
}
