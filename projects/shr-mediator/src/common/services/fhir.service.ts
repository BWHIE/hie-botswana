import { R4 } from '@ahryman40k/ts-fhir-types';
import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request as NestRequest, Res } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import config from '../../config';
import { LoggerService } from '../../logger/logger.service';
import { ResourceType, getCircularReplacer, getResourceTypeEnum } from '../utils/fhir';

export interface FhirClientConfig {
  serverUrl: string;
  username?: string;
  password?: string;
}

@Injectable()
export class FhirService {
  constructor(
    private httpService: HttpService,
    private readonly logger: LoggerService,
  ) {}

  async passthrough(
    @NestRequest() req: Request,
    @Res() res: Response,
    path: string,
  ): Promise<any> {
    const requestOptions: AxiosRequestConfig = {
      url: `${config.get('fhirServer:baseURL')}/${path}`,
      method: req.method,
      headers: {
        ...req.headers,
        'X-Forwarded-For': req.headers['x-forwarded-for'] || req.ip,
        'X-Forwarded-Proto': req.protocol,
        'X-Forwarded-Host': req.get('host'),
        'X-Forwarded-Port': req.get('x-forwarded-port') || req.socket.localPort,
      },
      auth: {
        username: config.get('fhirServer:username'),
        password: config.get('fhirServer:password'),
      },
      responseType: 'stream',
      // @ts-ignore
      data: req.rawBody,
    };

    return this.httpService.request(requestOptions).pipe(
      tap((response) => {
        res.status(response.status);
        response.data.pipe(res);
      }),
      catchError((error) => {
        const errorResponse = error.response
          ? JSON.stringify(error.response.data, getCircularReplacer())
          : error.message;
        const errorStatus = error.response
          ? error.response.status
          : HttpStatus.BAD_GATEWAY;

        this.logger.error('FHIR Request Error:', errorResponse);

        res.status(errorStatus).json({
          error: errorResponse,
          message: 'An error occurred while processing the FHIR request.',
          method: req.method,
          url: requestOptions.url,
          status: errorStatus,
        });
        return throwError(() => new Error(error));
      }),
    );
  }

  async saveResource(req: Request, res: Response) {
    const resource = req.body;
    const resourceType = req.params.resourceType;
    const id = req.params.id;

    if (id && !resource.id) {
      resource.id = id;
    }

    this.logger.log(
      `Received request to add resource type ${resourceType} with id ${id}`,
    );

    let path: string;
    if (req.method === 'POST') {
      path = getResourceTypeEnum(resourceType);
    } else if (req.method === 'PUT') {
      path = `${getResourceTypeEnum(resourceType)}/${id}`;
    } else {
      throw new BadGatewayException('Invalid request method');
    }
    try {
      const result = await this.passthrough(req, res, path);
      return result; // Handle the result if needed
    } catch (error) {
      if (error.response) {
        throw new InternalServerErrorException(error.response.data);
      } else {
        throw new InternalServerErrorException('Internal server error');
      }
    }
  }

  // Wrapper function that includes retry logic
  async postWithRetry(
    payload: any,
    options?: AxiosRequestConfig<any>,
    retryLimit = 2,
    timeout = 30000,
    path: string = ''
  ) {
    for (let attempt = 1; attempt <= retryLimit; attempt++) {
      try {
        const { data } = await this.httpService.axiosRef.post<any>(
          `${config.get('fhirServer:baseURL')}/${path}`,
          payload,
          options,
        );
        return data; // If request is successful, return the response
      } catch (error) {
        this.logger.error(
          `Attempt ${attempt} failed`,
          JSON.stringify({
            error: error.message,
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers,
          }),
        );

        // Sleep for a given amount of time
        await new Promise((resolve) => setTimeout(resolve, timeout));

        // If we are on the last attempt, re-throw the error
        if (attempt === retryLimit) {
          this.logger.error('All retries failed');
          throw error;
        }
      }
    }
  }

  async get(resource: ResourceType, options: AxiosRequestConfig, id?: string,): Promise<any> {
    let targetUri = config.get('fhirServer:baseURL') + '/' + resource;


    // Account for READ Operation
    if (id) {
      targetUri += `/${id}`;
    }

    try {
      const { data: result } = await this.httpService.axiosRef.get<R4.IBundle>(
        targetUri,
        {
          ...options,
          auth: {
            username: config.get('fhirServer:username'),
            password: config.get('fhirServer:password'),
          },
        },
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Could not get ${targetUri}:\n${JSON.stringify(error)}`,
      );
      throw new InternalServerErrorException(error);
    }
  }
}


