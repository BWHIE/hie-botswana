import { IBundle } from '@ahryman40k/ts-fhir-types/lib/R4';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../logger/logger.service';
import { Mapping } from './interfaces';
import { TerminologyService } from './terminology.service';

describe('TerminologyService', () => {
  let service: TerminologyService;
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

  describe('getMappedCodeFromMemory', () => {
    it('should return the mapped code and display when a matching mapping is found', () => {
      const mappings = [
        {
          from_concept_code: '123',
          to_concept_code: '456',
          to_concept_name_resolved: 'Concept Name 456',
        },
      ] as Mapping[];
      const code = '123';
      const result = service.getMappedCodeFromMemory(mappings, code);

      expect(result).toEqual({ code: '456', display: 'Concept Name 456' });
      expect(logger.log).toHaveBeenCalledWith(
        'Terminology mapping for code: 123',
      );
    });

    it('should return an empty object when no matching mapping is found', () => {
      const mappings = [
        {
          from_concept_code: '123',
          to_concept_code: '456',
          to_concept_name_resolved: 'Concept Name 456',
        },
      ] as Mapping[];
      const code = '789';
      const result = service.getMappedCodeFromMemory(mappings, code);

      expect(result).toEqual({});
      expect(logger.log).toHaveBeenCalledWith(
        'Terminology mapping for code: 789',
      );
    });

    it('should return an object with null values if mapping exists but codes are null', () => {
      const mappings = [
        {
          from_concept_code: '123',
          to_concept_code: null,
          to_concept_name_resolved: null,
        },
      ] as Mapping[];
      const code = '123';
      const result = service.getMappedCodeFromMemory(mappings, code);

      expect(result).toEqual({ code: null, display: null });
      expect(logger.log).toHaveBeenCalledWith(
        'Terminology mapping for code: 123',
      );
    });

    it('should return an empty object and log an error if an exception occurs', () => {
      const mappings = null; // This will cause an exception
      const code = '123';

      const result = service.getMappedCodeFromMemory(mappings, code);

      expect(result).toEqual({});
      expect(logger.error).toHaveBeenCalledWith(
        'Could not find any codings to translate',
      );
    });
  });

  describe('getIpmsCodeFromMemory', () => {
    it('should return the IPMS code and details when a "BROADER-THAN" mapping is found', () => {
      const mappings = [
        {
          from_concept_code: '123',
          from_concept_name_resolved: 'Concept Name 123',
          to_concept_code: '456',
          map_type: 'BROADER-THAN',
        },
      ] as Mapping[];
      const ipmsCodingInfo = [
        {
          id: '123',
          names: [{ name_type: 'Short', name: 'Short Name 123' }],
          extras: { IPMS_HL7_ORM_TYPE: 'ORM' },
        },
      ];

      service['ipmsCodingInfo'] = ipmsCodingInfo;
      const code = '456';
      const result = service.getIpmsCodeFromMemory(mappings, code);

      expect(result).toEqual({
        code: '123',
        display: 'Concept Name 123',
        mnemonic: 'Short Name 123',
        hl7Flag: 'ORM',
      });
    });

    it('should return the IPMS code and details when a "SAME-AS" mapping is found if "BROADER-THAN" is not found', () => {
      const mappings = [
        {
          from_concept_code: '789',
          from_concept_name_resolved: 'Concept Name 789',
          to_concept_code: '456',
          map_type: 'SAME-AS',
        },
      ] as Mapping[];
      const ipmsCodingInfo = [
        {
          id: '789',
          names: [{ name_type: 'Short', name: 'Short Name 789' }],
          extras: { IPMS_HL7_ORM_TYPE: 'ORM' },
        },
      ];

      service['ipmsCodingInfo'] = ipmsCodingInfo;
      const code = '456';
      const result = service.getIpmsCodeFromMemory(mappings, code);

      expect(result).toEqual({
        code: '789',
        display: 'Concept Name 789',
        mnemonic: 'Short Name 789',
        hl7Flag: 'ORM',
      });
    });

    it('should return null when no matching mapping is found', () => {
      const mappings = [
        {
          from_concept_code: '123',
          from_concept_name_resolved: 'Concept Name 123',
          to_concept_code: '456',
          map_type: 'BROADER-THAN',
        },
      ] as Mapping[];

      const code = '789'; // No matching code in mappings
      const result = service.getIpmsCodeFromMemory(mappings, code);

      expect(result).toBeNull();
    });

    it('should return null and log an error if an exception occurs', () => {
      const mappings = null; // This will cause an exception
      const code = '123';

      const result = service.getIpmsCodeFromMemory(mappings, code);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return null and default HL7 flag "LAB" when extras are missing', () => {
      const mappings = [
        {
          from_concept_code: '123',
          from_concept_name_resolved: 'Concept Name 123',
          to_concept_code: '456',
          map_type: 'BROADER-THAN',
        },
      ] as Mapping[];
      const ipmsCodingInfo = [
        {
          id: '123',
          names: [{ name_type: 'Short', name: 'Short Name 123' }],
          extras: {}, // No IPMS_HL7_ORM_TYPE provided
        },
      ];

      service['ipmsCodingInfo'] = ipmsCodingInfo;
      const code = '456';
      const result = service.getIpmsCodeFromMemory(mappings, code);

      expect(result).toEqual({
        code: '123',
        display: 'Concept Name 123',
        mnemonic: 'Short Name 123',
        hl7Flag: 'LAB', // Default value when not provided
      });
    });
  });
});
