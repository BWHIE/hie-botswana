/**
 * Represents a location in the facility registry system.
 *
 * This interface defines the structure of location data used throughout
 * the application. It follows FHIR Location resource standards and includes
 * all necessary fields for healthcare facility management.
 *
 * @interface Location
 */
export interface Location {
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  status: string;
  name: string;
  description?: string;
  type?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  address?: {
    text?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  position?: {
    longitude?: number;
    latitude?: number;
  };
  managingOrganization?: {
    reference: string;
  };
  partOf?: {
    reference: string;
  };
}
