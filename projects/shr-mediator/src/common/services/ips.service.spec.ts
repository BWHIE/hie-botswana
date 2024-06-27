import { R4 } from '@ahryman40k/ts-fhir-types';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import Client from 'fhirclient/lib/Client';
import { LoggerService } from '../../logger/logger.service';
import { IpsService } from './ips.service';

describe('IpsService', () => {
  let service: IpsService;
  let loggerService: LoggerService;
  let httpService: HttpService;
  let shrClient: Client;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IpsService,
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IpsService>(IpsService);
    loggerService = module.get<LoggerService>(LoggerService);
    httpService = module.get<HttpService>(HttpService);
    shrClient = {
      request: jest.fn(),
    } as any as Client;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateIpsBundle', () => {
    it('should generate an IPS bundle', async () => {
      const patients: R4.IPatient[] = [
        {
          resourceType: 'Patient',
          id: '1',
          identifier: [
            {
              system: 'system',
              value: 'identifier1',
            },
          ],
        },
      ];
      const lastUpdated = '2021-01-01';
      const system = 'system';

      jest
        .spyOn(shrClient, 'request')
        .mockImplementation(async (query: string) => {
          if (query.startsWith('Patient')) {
            return [
              {
                resourceType: 'Patient',
                id: '1',
              },
            ];
          } else if (query.startsWith('Encounter')) {
            return [
              {
                resourceType: 'Encounter',
                id: '1',
              },
            ];
          } else if (query.startsWith('Observation')) {
            return [
              {
                resourceType: 'Observation',
                id: '1',
              },
            ];
          }
        });

      const result = await service.generateIpsBundle(
        patients,
        shrClient,
        lastUpdated,
        system,
      );

      expect(result).toBeDefined();
      expect(result.resourceType).toBe('Bundle');
      expect(result.type).toBe(R4.BundleTypeKind._document);
      expect(result.entry).toHaveLength(4);
      expect(result.entry[0]).toHaveProperty('resourceType', 'Composition');
    });

    it('should handle empty patients array', async () => {
      const patients: R4.IPatient[] = [];
      const lastUpdated = '2021-01-01';
      const system = 'system';

      jest.spyOn(shrClient, 'request').mockResolvedValue([]);

      const result = await service.generateIpsBundle(
        patients,
        shrClient,
        lastUpdated,
        system,
      );

      expect(result).toBeDefined();
      expect(result.resourceType).toBe('Bundle');
      expect(result.type).toBe(R4.BundleTypeKind._document);
      expect(result.entry).toHaveLength(1);
      expect(result.entry[0]).toHaveProperty('resourceType', 'Composition');
    });

    it('should log errors and throw an exception', async () => {
      const patients: R4.IPatient[] = [
        {
          resourceType: 'Patient',
          id: '1',
          identifier: [
            {
              system: 'system',
              value: 'identifier1',
            },
          ],
        },
      ];
      const lastUpdated = '2021-01-01';
      const system = 'system';

      jest
        .spyOn(shrClient, 'request')
        .mockRejectedValue(new Error('test error'));

      await expect(
        service.generateIpsBundle(patients, shrClient, lastUpdated, system),
      ).rejects.toThrow('test error');
    });
  });
});
