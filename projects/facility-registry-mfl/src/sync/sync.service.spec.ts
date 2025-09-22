import { Test, TestingModule } from "@nestjs/testing";
import { HttpService } from "@nestjs/axios";
import { SyncService } from "./sync.service";
import { LocationService } from "../location/location.service";
import { OrganizationService } from "../organization/organization.service";
import { Location, Organization } from "../common/interfaces";

describe("SyncService", () => {
  let service: SyncService;
  let locationService: LocationService;
  let organizationService: OrganizationService;

  const mockLocation: Location = {
    id: "location-1",
    identifier: [
      { system: "MFL", value: "MFL-001" },
      { system: "FACILITY", value: "FAC-001" },
    ],
    status: "active",
    name: "Test Hospital",
    description: "A test hospital",
    type: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
          code: "HOSP",
          display: "Hospital",
        },
      ],
    },
    address: {
      text: "123 Test Street",
      city: "Test City",
      country: "Botswana",
    },
  };

  const mockOrganization: Organization = {
    id: "org-1",
    identifier: [
      { system: "MFL", value: "MFL-ORG-001" },
      { system: "ORGANIZATION", value: "ORG-001" },
    ],
    active: true,
    name: "Test Health Organization",
    type: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/organization-type",
            code: "prov",
            display: "Healthcare Provider",
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: LocationService,
          useValue: {
            getAllLocations: jest.fn(),
          },
        },
        {
          provide: OrganizationService,
          useValue: {
            getAllOrganizations: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    locationService = module.get<LocationService>(LocationService);
    organizationService = module.get<OrganizationService>(OrganizationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("locationExistsByIdentifier", () => {
    it("should return true when location exists by identifier", () => {
      const localLocationMap = new Map<string, Location>();
      localLocationMap.set("MFL-001", mockLocation);
      localLocationMap.set("FAC-001", mockLocation);

      const result = (service as any).locationExistsByIdentifier(
        mockLocation,
        localLocationMap
      );
      expect(result).toBe(true);
    });

    it("should return false when location does not exist by identifier", () => {
      const localLocationMap = new Map<string, Location>();
      localLocationMap.set("MFL-002", mockLocation);

      const result = (service as any).locationExistsByIdentifier(
        mockLocation,
        localLocationMap
      );
      expect(result).toBe(false);
    });

    it("should return true when any identifier matches", () => {
      const localLocationMap = new Map<string, Location>();
      localLocationMap.set("FAC-001", mockLocation);

      const result = (service as any).locationExistsByIdentifier(
        mockLocation,
        localLocationMap
      );
      expect(result).toBe(true);
    });

    it("should return false when location has undefined identifier", () => {
      const localLocationMap = new Map<string, Location>();
      localLocationMap.set("FAC-001", mockLocation);

      const locationWithUndefinedIdentifier = {
        ...mockLocation,
        identifier: undefined,
      };
      const result = (service as any).locationExistsByIdentifier(
        locationWithUndefinedIdentifier,
        localLocationMap
      );
      expect(result).toBe(false);
    });

    it("should return false when location has null identifier", () => {
      const localLocationMap = new Map<string, Location>();
      localLocationMap.set("FAC-001", mockLocation);

      const locationWithNullIdentifier = { ...mockLocation, identifier: null };
      const result = (service as any).locationExistsByIdentifier(
        locationWithNullIdentifier,
        localLocationMap
      );
      expect(result).toBe(false);
    });
  });

  describe("organizationExistsByIdentifier", () => {
    it("should return true when organization exists by identifier", () => {
      const localOrganizationMap = new Map<string, Organization>();
      localOrganizationMap.set("MFL-ORG-001", mockOrganization);
      localOrganizationMap.set("ORG-001", mockOrganization);

      const result = (service as any).organizationExistsByIdentifier(
        mockOrganization,
        localOrganizationMap
      );
      expect(result).toBe(true);
    });

    it("should return false when organization does not exist by identifier", () => {
      const localOrganizationMap = new Map<string, Organization>();
      localOrganizationMap.set("MFL-ORG-002", mockOrganization);

      const result = (service as any).organizationExistsByIdentifier(
        mockOrganization,
        localOrganizationMap
      );
      expect(result).toBe(false);
    });

    it("should return true when any identifier matches", () => {
      const localOrganizationMap = new Map<string, Organization>();
      localOrganizationMap.set("ORG-001", mockOrganization);

      const result = (service as any).organizationExistsByIdentifier(
        mockOrganization,
        localOrganizationMap
      );
      expect(result).toBe(true);
    });

    it("should return false when organization has undefined identifier", () => {
      const localOrganizationMap = new Map<string, Organization>();
      localOrganizationMap.set("ORG-001", mockOrganization);

      const organizationWithUndefinedIdentifier = {
        ...mockOrganization,
        identifier: undefined,
      };
      const result = (service as any).organizationExistsByIdentifier(
        organizationWithUndefinedIdentifier,
        localOrganizationMap
      );
      expect(result).toBe(false);
    });

    it("should return false when organization has null identifier", () => {
      const localOrganizationMap = new Map<string, Organization>();
      localOrganizationMap.set("ORG-001", mockOrganization);

      const organizationWithNullIdentifier = {
        ...mockOrganization,
        identifier: null,
      };
      const result = (service as any).organizationExistsByIdentifier(
        organizationWithNullIdentifier,
        localOrganizationMap
      );
      expect(result).toBe(false);
    });
  });

  describe("processLocationsDetailed", () => {
    it("should not add duplicate locations based on identifier", async () => {
      const existingLocations = [mockLocation];
      const mflLocationIds = ["location-1", "location-2"];

      jest
        .spyOn(locationService, "getAllLocations")
        .mockResolvedValue(existingLocations);
      jest
        .spyOn(service as any, "fetchMFLResourceDetails")
        .mockResolvedValue(mockLocation);
      jest.spyOn(service as any, "saveLocations").mockResolvedValue(undefined);

      const result = await (service as any).processLocationsDetailed(
        mflLocationIds,
        existingLocations
      );

      // Should not add the duplicate location
      expect(result.newCount).toBe(0);
    });

    it("should add new locations that do not exist by identifier", async () => {
      const existingLocations = [mockLocation];
      const newLocation: Location = {
        ...mockLocation,
        id: "location-2",
        identifier: [
          { system: "MFL", value: "MFL-002" },
          { system: "FACILITY", value: "FAC-002" },
        ],
        name: "Another Hospital",
      };
      const mflLocationIds = ["location-2"];

      jest
        .spyOn(locationService, "getAllLocations")
        .mockResolvedValue(existingLocations);
      jest
        .spyOn(service as any, "fetchMFLResourceDetails")
        .mockResolvedValue(newLocation);
      jest.spyOn(service as any, "saveLocations").mockResolvedValue(undefined);

      const result = await (service as any).processLocationsDetailed(
        mflLocationIds,
        existingLocations
      );

      expect(result.newCount).toBe(1);
    });
  });

  describe("processOrganizationsDetailed", () => {
    it("should not add duplicate organizations based on identifier", async () => {
      const existingOrganizations = [mockOrganization];
      const mflOrganizationIds = ["org-1", "org-2"];

      jest
        .spyOn(organizationService, "getAllOrganizations")
        .mockResolvedValue(existingOrganizations);
      jest
        .spyOn(service as any, "fetchMFLResourceDetails")
        .mockResolvedValue(mockOrganization);
      jest
        .spyOn(service as any, "saveOrganizations")
        .mockResolvedValue(undefined);

      const result = await (service as any).processOrganizationsDetailed(
        mflOrganizationIds,
        existingOrganizations
      );

      // Should not add the duplicate organization
      expect(result.newCount).toBe(0);
    });

    it("should add new organizations that do not exist by identifier", async () => {
      const existingOrganizations = [mockOrganization];
      const newOrganization: Organization = {
        ...mockOrganization,
        id: "org-2",
        identifier: [
          { system: "MFL", value: "MFL-ORG-002" },
          { system: "ORGANIZATION", value: "ORG-002" },
        ],
        name: "Another Health Organization",
      };
      const mflOrganizationIds = ["org-2"];

      jest
        .spyOn(organizationService, "getAllOrganizations")
        .mockResolvedValue(existingOrganizations);
      jest
        .spyOn(service as any, "fetchMFLResourceDetails")
        .mockResolvedValue(newOrganization);
      jest
        .spyOn(service as any, "saveOrganizations")
        .mockResolvedValue(undefined);

      const result = await (service as any).processOrganizationsDetailed(
        mflOrganizationIds,
        existingOrganizations
      );

      expect(result.newCount).toBe(1);
    });
  });

  describe("processLocations (legacy method)", () => {
    it("should not add duplicate locations based on identifier", async () => {
      const existingLocations = [mockLocation];
      const mflData = {
        resourceType: "Bundle",
        type: "searchset",
        timestamp: "2024-01-01T00:00:00Z",
        entry: [
          {
            fullUrl: "https://example.com/location/location-1",
            resource: mockLocation,
          },
        ],
      };

      jest.spyOn(service as any, "saveLocations").mockResolvedValue(undefined);

      const result = await (service as any).processLocations(
        mflData,
        existingLocations
      );

      // Should not add the duplicate location
      expect(result.newCount).toBe(0);
    });

    it("should add new locations that do not exist by identifier", async () => {
      const existingLocations = [mockLocation];
      const newLocation: Location = {
        ...mockLocation,
        id: "location-2",
        identifier: [
          { system: "MFL", value: "MFL-002" },
          { system: "FACILITY", value: "FAC-002" },
        ],
        name: "Another Hospital",
      };
      const mflData = {
        resourceType: "Bundle",
        type: "searchset",
        timestamp: "2024-01-01T00:00:00Z",
        entry: [
          {
            fullUrl: "https://example.com/location/location-2",
            resource: newLocation,
          },
        ],
      };

      jest.spyOn(service as any, "saveLocations").mockResolvedValue(undefined);

      const result = await (service as any).processLocations(
        mflData,
        existingLocations
      );

      expect(result.newCount).toBe(1);
    });
  });

  describe("processOrganizations (legacy method)", () => {
    it("should not add duplicate organizations based on identifier", async () => {
      const existingOrganizations = [mockOrganization];
      const mflData = {
        resourceType: "Bundle",
        type: "searchset",
        timestamp: "2024-01-01T00:00:00Z",
        entry: [
          {
            fullUrl: "https://example.com/organization/org-1",
            resource: mockOrganization,
          },
        ],
      };

      jest
        .spyOn(service as any, "saveOrganizations")
        .mockResolvedValue(undefined);

      const result = await (service as any).processOrganizations(
        mflData,
        existingOrganizations
      );

      // Should not add the duplicate organization
      expect(result.newCount).toBe(0);
    });

    it("should add new organizations that do not exist by identifier", async () => {
      const existingOrganizations = [mockOrganization];
      const newOrganization: Organization = {
        ...mockOrganization,
        id: "org-2",
        identifier: [
          { system: "MFL", value: "MFL-ORG-002" },
          { system: "ORGANIZATION", value: "ORG-002" },
        ],
        name: "Another Health Organization",
      };
      const mflData = {
        resourceType: "Bundle",
        type: "searchset",
        timestamp: "2024-01-01T00:00:00Z",
        entry: [
          {
            fullUrl: "https://example.com/organization/org-2",
            resource: newOrganization,
          },
        ],
      };

      jest
        .spyOn(service as any, "saveOrganizations")
        .mockResolvedValue(undefined);

      const result = await (service as any).processOrganizations(
        mflData,
        existingOrganizations
      );

      expect(result.newCount).toBe(1);
    });
  });
});
