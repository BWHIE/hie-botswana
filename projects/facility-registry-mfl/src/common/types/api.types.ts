/**
 * Common API response types for the Facility Registry MFL API.
 */

/**
 * Standard API response wrapper for single items
 */
export type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
  timestamp: string;
};

/**
 * Simple array response for list endpoints (no pagination)
 */
export type ListResponse<T> = T[];

/**
 * Search query parameters for locations
 */
export type LocationSearchQuery = {
  name?: string;
  identifier?: string;
  type?: string;
};

/**
 * Search query parameters for organizations
 */
export type OrganizationSearchQuery = {
  name?: string;
  identifier?: string;
  type?: string;
  active?: boolean;
};

/**
 * HTTP methods used in the API
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * API endpoint paths
 */
export type ApiEndpoint =
  | "/api/v1"
  | "/api/v1/location"
  | "/api/v1/location/search"
  | "/api/v1/location/identifier/:identifier"
  | "/api/v1/organization"
  | "/api/v1/organization/search"
  | "/api/v1/organization/identifier/:identifier"
  | "/health";
