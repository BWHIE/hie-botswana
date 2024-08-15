import { Test, TestingModule } from '@nestjs/testing';
import { MflService } from './mfl.service';
import { LoggerService } from '../../logger/logger.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { R4 } from '@ahryman40k/ts-fhir-types';

describe('MflService', () => {
  let service: MflService;
  let loggerService: LoggerService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MflService,
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              get: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MflService>(MflService);
    loggerService = module.get<LoggerService>(LoggerService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('mapLocations', () => {
    it('should call addBwLocations and return the updated bundle', async () => {
      const mockBundle = { resourceType: 'Bundle', entry: [] } as R4.IBundle;

      jest.spyOn(service, 'addBwLocations').mockResolvedValue(mockBundle);

      const result = await service.mapLocations(mockBundle);

      expect(result).toBe(mockBundle);
      expect(service.addBwLocations).toHaveBeenCalledWith(mockBundle);
      expect(loggerService.log).toHaveBeenCalledWith('Mapping Locations!');
    });
  });

  describe('addBwLocations', () => {
    it('should log an error when there are multiple organizations', async () => {
      const mockBundle = {
        resourceType: 'Bundle',
        entry: [
          {
            resource: {
              resourceType: 'Task',
              location: { reference: 'Location/1' },
            } as R4.ITask,
          },
          {
            resource: {
              resourceType: 'ServiceRequest',
              requester: { reference: 'Organization/1' },
            } as R4.IServiceRequest,
          },
          {
            resource: {
              resourceType: 'ServiceRequest',
              requester: { reference: 'Organization/2' },
            } as R4.IServiceRequest,
          },
        ],
      } as R4.IBundle;

      await service.addBwLocations(mockBundle);

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Wrong number of ordering Organizations and Locations')
      );
    });

    it('should call translateLocation and update bundle entries', async () => {
      const mockBundle = {
        resourceType: 'Bundle',
        entry: [
          {
            resource: {
              resourceType: 'Task',
              location: { reference: 'Location/1' },
            } as R4.ITask,
          },
          {
            resource: {
              resourceType: 'ServiceRequest',
              requester: { reference: 'Organization/1' },
            } as R4.IServiceRequest,
          },
          {
            resource: {
              resourceType: 'Location',
              id: '1',
              managingOrganization: { reference: 'Organization/1' },
            } as R4.ILocation,
          },
        ],
      } as R4.IBundle;

      const translatedLocation = { resourceType: 'Location', id: '2' } as R4.ILocation;
      const translatedOrganization = { resourceType: 'Organization', id: '3' } as R4.IOrganization;

      jest.spyOn(service, 'translateLocation').mockResolvedValueOnce(translatedLocation);
      jest.spyOn(service, 'translateLocation').mockResolvedValueOnce(translatedOrganization);

      const result = await service.addBwLocations(mockBundle);

      expect(result.entry).toHaveLength(5);
      expect(service.translateLocation).toHaveBeenCalledTimes(2);
      expect(loggerService.log).toHaveBeenCalledWith('Adding Location Info to Bundle');
    });
  });

  describe('translateLocation', () => {
    it('should return mapped location when found by identifier', async () => {
      const mockLocation = { resourceType: 'Location', identifier: [{ value: '123' }] } as R4.ILocation;
      const fetchedBundle = {
        resourceType: 'Bundle',
        entry: [{ resource: { resourceType: 'Location', id: '1' } }],
      } as R4.IBundle;

      jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: fetchedBundle });

      const result = await service.translateLocation(mockLocation);

      expect(result).toEqual(fetchedBundle.entry[0].resource);
      expect(loggerService.log).toHaveBeenCalledWith(
        'Looking up location by identifier: {"value":"123"}'
      );
    });

    it('should return mapped location when found by name', async () => {
      const mockLocation = { resourceType: 'Location', name: 'Test Location' } as R4.ILocation;
      const fetchedBundle = {
        resourceType: 'Bundle',
        entry: [{ resource: { resourceType: 'Location', id: '1' } }],
      } as R4.IBundle;

      jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: fetchedBundle });

      const result = await service.translateLocation(mockLocation);

      expect(result).toEqual(fetchedBundle.entry[0].resource);
      expect(loggerService.log).toHaveBeenCalledWith('Looking up location by name: Test Location');
    });

    it('should log a warning when no location is found', async () => {
      const mockLocation = { resourceType: 'Location', name: 'Nonexistent Location' } as R4.ILocation;
      jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: { resourceType: 'Bundle', entry: [] } });

      const result = await service.translateLocation(mockLocation);

      expect(result.resourceType).toBe('Location');
      expect(loggerService.warn).toHaveBeenCalledWith('No matching location found.');
    });

    it('should log an error when there is an error fetching data', async () => {
      const mockLocation = { resourceType: 'Location', identifier: [{ value: '123' }] } as R4.ILocation;
      const errorMessage = 'Network Error';

      jest.spyOn(httpService.axiosRef, 'get').mockRejectedValue(new Error(errorMessage));

      await service.translateLocation(mockLocation);

      expect(loggerService.error).toHaveBeenCalledWith(
        'Error translating location:',
        expect.any(Error),
      );
    });
  });
});
