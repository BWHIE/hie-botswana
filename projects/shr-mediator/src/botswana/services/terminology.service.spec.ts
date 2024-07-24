import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import config from '../../config';
import { LoggerService } from '../../logger/logger.service';
import { TerminologyService } from './terminology.service';
import { IBundle } from '@ahryman40k/ts-fhir-types/lib/R4';
import { R4 } from '@ahryman40k/ts-fhir-types';

describe('TerminologyService', () => {
  let service: TerminologyService;
  let httpService: HttpService;
  let logger: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TerminologyService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              get: jest.fn(),
            },
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TerminologyService>(TerminologyService);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mapConcepts', () => {
    it('should call addAllCodings and return the modified labBundle', async () => {
      const labBundle = { entry: [] } as IBundle; // Simplified example
      jest.spyOn(service, 'addAllCodings').mockResolvedValue(labBundle);

      const result = await service.mapConcepts(labBundle);

      expect(service.addAllCodings).toHaveBeenCalledWith(labBundle);
      expect(result).toEqual(labBundle);
    });
  });

  describe('addAllCodings', () => {
    it('should log and return the labBundle unmodified if no ServiceRequest is found', async () => {
      const labBundle = {
        entry: [{ resource: { resourceType: 'Observation' } }],
      } as IBundle;
      const expectedBundle = { ...labBundle };

      const result = await service.addAllCodings(labBundle);

      expect(result).toEqual(expectedBundle);
    });
  });

  describe('getOclMapping', () => {
    it('should return data from OCL API', async () => {
      const responseData = [{ code: '123', display: 'Test Code' }];
      jest
        .spyOn(httpService.axiosRef, 'get')
        .mockImplementation(() => Promise.resolve({ data: responseData }));

      const result = await service.getOclMapping('/test-query');

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        `${config.get('bwConfig:oclUrl')}/test-query`,
        { timeout: config.get('bwConfig:requestTimeout') },
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('translateCoding', () => {
    it('should add translated codings when existing codings are provided', async () => {
      const resource = {
        resourceType: 'ServiceRequest',
        code: {
          coding: [{ system: 'http://ipms-system', code: '12345' }],
        },
      } as R4.IServiceRequest;

      jest.spyOn(service, 'getCoding').mockImplementation((r, system) => {
        return { system, code: '12345' };
      });

      jest
        .spyOn(service, 'getMappedCode')
        .mockResolvedValueOnce({ code: '123', display: 'Test 1 Display' });
      jest
        .spyOn(service, 'getMappedCode')
        .mockResolvedValueOnce({ code: '456', display: 'Test 2 Display' });
      jest.spyOn(service, 'getIpmsCode').mockResolvedValue({
        code: '67890',
        mnemonic: 'MN123',
        display: 'IPMS Display',
        hl7Flag: 'LAB',
      });

      const result = await service.translateCoding(resource);

      expect(result.code.coding).toHaveLength(3); // Existing plus new one
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('PIMS Coding:'),
      );
      expect(service.getMappedCode).toHaveBeenCalledTimes(2); // Called for PIMS and CIEL
      expect(service.getIpmsCode).not.toHaveBeenCalled(); // Not called because initial IPMS coding was found
    });

    it('should handle no initial codings gracefully', async () => {
      const resource = {
        resourceType: 'ServiceRequest',
        code: {
          coding: [],
        },
      } as R4.IServiceRequest;

      const result = await service.translateCoding(resource);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Could not any codings to translate'),
      );
      expect(result).toEqual(resource); // Expect the resource to be unchanged
    });

    // Add more tests to cover other branches and error handling
  });
});
