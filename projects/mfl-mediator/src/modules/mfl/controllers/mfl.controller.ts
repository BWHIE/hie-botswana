import { Controller, Get, Param, Logger, Headers } from "@nestjs/common";
import { MflService } from "../services/mfl.service";
import { OpenHimService } from "../../../common/openhim/openhim.service";
import { fhirR4 } from "@smile-cdr/fhirts";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";

@ApiTags("MFL")
@Controller("fhir")
export class MflController {
  private readonly logger = new Logger(MflController.name);

  constructor(
    private readonly mflService: MflService,
    private readonly openHimService: OpenHimService
  ) {}

  private convertHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (Array.isArray(value)) {
        result[key] = value.join(", ");
      } else if (typeof value === "string") {
        result[key] = value;
      }
    }
    return result;
  }

  @ApiOperation({ summary: "Get all locations from MFL" })
  @ApiResponse({
    status: 200,
    description: "Returns a FHIR Bundle containing all locations",
    type: fhirR4.Bundle,
  })
  @Get("bundle/location")
  async getLocations(@Headers() headers: any): Promise<fhirR4.Bundle> {
    return this.mflService.getLocations();
  }

  @ApiOperation({ summary: "Get a specific location from MFL" })
  @ApiResponse({
    status: 200,
    description: "Returns a FHIR Location",
    type: fhirR4.Location,
  })
  @Get("location/:id")
  async getLocation(
    @Param("id") id: string,
    @Headers() headers: any
  ): Promise<fhirR4.Location> {
    return this.mflService.getLocation(id);
  }

  @ApiOperation({ summary: "Get all organizations from MFL" })
  @ApiResponse({
    status: 200,
    description: "Returns a FHIR Bundle containing all organizations",
    type: fhirR4.Bundle,
  })
  @Get("bundle/organization")
  async getOrganizations(@Headers() headers: any): Promise<fhirR4.Bundle> {
    return this.mflService.getOrganizations();
  }

  @ApiOperation({ summary: "Get a specific organization from MFL" })
  @ApiResponse({
    status: 200,
    description: "Returns a FHIR Organization",
    type: fhirR4.Organization,
  })
  @Get("organization/:id")
  async getOrganization(
    @Param("id") id: string,
    @Headers() headers: any
  ): Promise<fhirR4.Organization> {
    return this.mflService.getOrganization(id);
  }
}
