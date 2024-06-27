import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import config from '../../config';
import { LoggerService } from '../../logger/logger.service';
import { getResourceTypeEnum } from '../utils/fhir';
import { FhirService } from './fhir.service';

jest.mock('../../config');
jest.mock('../utils/fhir');

describe('FhirService', () => {
  let service: FhirService;
  let httpService: HttpService;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FhirService,
        {
          provide: HttpService,
          useValue: {
            request: jest.fn(),
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

    service = module.get<FhirService>(FhirService);
    httpService = module.get<HttpService>(HttpService);
    loggerService = module.get<LoggerService>(LoggerService);

    config.get = jest.fn().mockImplementation((key) => {
      switch (key) {
        case 'fhirServer:baseURL':
          return 'http://fhir-server';
        case 'fhirServer:username':
          return 'username';
        case 'fhirServer:password':
          return 'password';
        default:
          return null;
      }
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('passthrough', () => {
    it('should pass the request through and pipe the response', (done) => {
      const mockResponse: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        pipe: jest.fn(),
      };
      const mockReq: any = {
        method: 'GET',
        url: '/Patient/1',
        headers: {},
      };
      const httpResponse: any = {
        status: 200,
        data: {
          pipe: jest.fn().mockImplementation((res) => {
            res.status(200);
            done();
          }),
        },
      };

      jest.spyOn(httpService, 'request').mockReturnValue(of(httpResponse));

      service.passthrough(mockReq, mockResponse).subscribe();

      expect(httpService.request).toHaveBeenCalledWith({
        url: 'http://fhir-server/Patient/1',
        method: 'GET',
        responseType: 'stream',
        headers: {},
        auth: {
          username: 'username',
          password: 'password',
        },
      });
    });

    it('should handle errors', (done) => {
      const mockResponse: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation(() => {
           return {}
        }),
      };
      const mockReq: any = {
        method: 'GET',
        url: '/Patient/1',
        headers: {},
      };
      const error = new Error('test error');

      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => error));

      service.passthrough(mockReq, mockResponse).subscribe({
        error: (err) => {
          expect(mockResponse.status).toHaveBeenCalledWith(502);
          expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'test error',
          });
          done();
        },
      });
    });
  });

  describe('saveResource', () => {
    it('should save a new resource', async () => {
      const mockReq: any = {
        method: 'POST',
        body: {},
        params: { resourceType: 'Patient' },
      };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      (getResourceTypeEnum as jest.Mock).mockReturnValue('Patient');

      jest.spyOn(service, 'passthrough').mockReturnValue(of({}));

      await service.saveResource(mockReq, mockRes);

      expect(service.passthrough).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        'http://fhir-server/Patient',
      );
    });

    it('should update an existing resource', async () => {
      const mockReq: any = {
        method: 'PUT',
        body: {},
        params: { resourceType: 'Patient', id: '1' },
      };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      (getResourceTypeEnum as jest.Mock).mockReturnValue('Patient');

      jest.spyOn(service, 'passthrough').mockReturnValue(of({}));

      await service.saveResource(mockReq, mockRes);

      expect(service.passthrough).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        'http://fhir-server/Patient/1',
      );
    });

    it('should throw an error for invalid method', async () => {
      const mockReq: any = {
        method: 'DELETE',
        body: {},
        params: { resourceType: 'Patient' },
      };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await expect(service.saveResource(mockReq, mockRes)).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('should handle errors', async () => {
      const mockReq: any = {
        method: 'POST',
        body: {},
        params: { resourceType: 'Patient' },
      };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      (getResourceTypeEnum as jest.Mock).mockReturnValue('Patient');

      jest.spyOn(service, 'passthrough').mockImplementation(() => {
        throw new Error('test error');
      });

      await expect(service.saveResource(mockReq, mockRes)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(loggerService.error).toHaveBeenCalledWith(new Error('test error'));
    });
  });
});
