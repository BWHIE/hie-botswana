import { Test, TestingModule } from '@nestjs/testing';
import { MpiService } from './mpi.service';
import { FhirService } from '../../common/services/fhir.service';
import { LoggerService } from '../../logger/logger.service';
import { R4 } from '@ahryman40k/ts-fhir-types';
import config from '../../config';

jest.mock('../../common/services/fhir.service');
jest.mock('../../logger/logger.service');
jest.mock('../../config');

describe('MpiService', () => {
  let service: MpiService;
  let fhirService: FhirService;
  let logger: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MpiService, FhirService, LoggerService],
    }).compile();

    service = module.get<MpiService>(MpiService);
    fhirService = module.get<FhirService>(FhirService);
    logger = module.get<LoggerService>(LoggerService);
    config.get = jest.fn((path) => {
      switch (path) {
        case 'bwConfig:requestTimeout':
          return 10000;
        case 'mediator:client:username':
          return 'user';
        case 'mediator:client:password':
          return 'password';
        case 'bwConfig:retryCount':
          return 3;
        case 'bwConfig:retryDelay':
          return 100;
        default:
          return null;
      }
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateCrPatient', () => {
    it('should update CR patient successfully', async () => {
      const mockBundle: R4.IBundle = {
        resourceType: 'Bundle',
        entry: [
          {
            resource: {
              resourceType: 'Patient',
              id: '123',
            },
          },
        ],
      };
      const mockPatient = mockBundle.entry![0].resource as R4.IPatient;
      const mockOptions = {
        timeout: 10000,
        data: {},
        auth: { username: 'user', password: 'password' },
      };

      fhirService.postWithRetry = jest.fn().mockResolvedValue(mockPatient);

      const result = await service.updateCrPatient(mockBundle);

      expect(fhirService.postWithRetry).toHaveBeenCalledWith(
        mockPatient,
        mockOptions,
        3,
        100,
      );
      expect(result).toEqual(mockBundle);
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should handle when no patient is found in the bundle', async () => {
      const emptyBundle: R4.IBundle = {
        resourceType: 'Bundle',
        entry: [], // No patient entry
      };

      const result = await service.updateCrPatient(emptyBundle);

      expect(fhirService.postWithRetry).not.toHaveBeenCalled();
      expect(result).toEqual(emptyBundle);
    });
  });
});
