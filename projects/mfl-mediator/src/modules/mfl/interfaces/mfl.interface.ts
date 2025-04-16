import { fhirR4 } from "@smile-cdr/fhirts";
import { Request } from "express";

export interface IMflService {
  getLocations(request: Request): Promise<fhirR4.Bundle>;
  getOrganizations(request: Request): Promise<fhirR4.Bundle>;
}

export interface IMflResponse {
  data: fhirR4.Bundle;
  status: number;
  statusText: string;
}
