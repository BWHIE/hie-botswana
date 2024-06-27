import { R4 } from '@ahryman40k/ts-fhir-types';
import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import config from '../../config';
import { LoggerService } from '../../logger/logger.service';
import { ResourceType, getResourceTypeEnum } from '../utils/fhir';

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

  passthrough(req: Request, res: Response, url?: string): Observable<any> {
    const fhirUrl = `${config.get('fhirServer:baseURL')}${req.url}`;
    return this.httpService
      .request({
        url: url || fhirUrl,
        method: req.method,
        responseType: 'stream',
        headers: req.headers,
        auth: {
          username: config.get('fhirServer:username'),
          password: config.get('fhirServer:password'),
        },
      })
      .pipe(
        tap((response) => {
          res.status(response.status);
          response.data.pipe(res);
        }),
        catchError((error) => {
          res.status(HttpStatus.BAD_GATEWAY).json({ error: error.message });
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
      'Received a request to add resource type ' +
        resourceType +
        ' with id ' +
        id,
    );

    let uri;
    if (req.method === 'POST') {
      uri =
        config.get('fhirServer:baseURL') +
        '/' +
        getResourceTypeEnum(resourceType).toString();
    } else if (req.method === 'PUT') {
      uri =
        config.get('fhirServer:baseURL') +
        '/' +
        getResourceTypeEnum(resourceType).toString() +
        '/' +
        id;
    } else {
      // Invalid request method
      throw new BadGatewayException('Invalid request method');
    }

    try {
      // Perform  request
      this.logger.log('Sending ' + req.method + ' request to ' + uri);

      return this.passthrough(req, res, uri);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  // Wrapper function that includes retry logic
  async postWithRetry(
    payload: any,
    options?: AxiosRequestConfig<any>,
    retryLimit = 2,
    timeout = 30000,
  ) {
    for (let attempt = 1; attempt <= retryLimit; attempt++) {
      try {
        const { data } = await this.httpService.axiosRef.post<R4.IBundle>(
          config.get('fhirServer:baseURL'),
          payload,
          options,
        );
        return data; // If request is successful, return the response
      } catch (error) {
        this.logger.error(`Attempt ${attempt} failed`, error);

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

  async get(resource: ResourceType, options: AxiosRequestConfig): Promise<any> {
    const targetUri = config.get('fhirServer:baseURL') + '/' + resource;

    this.logger.log(`Getting ${targetUri}`);

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
