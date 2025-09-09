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
