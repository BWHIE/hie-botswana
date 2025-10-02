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
import {
  ResourceType,
  getCircularReplacer,
  getResourceTypeEnum,
} from '../utils/fhir';

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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  async post<T, P = any>(
    payload: P,
    options?: AxiosRequestConfig<any>,
    path: string = '',
  ) {
    const { data } = await this.httpService.axiosRef.post<T>(
      `${config.get('fhirServer:baseURL')}/${path}`,
      payload,
      options,
    );

    return data; // If request is successful, return the response
  }

  // Wrapper function that includes retry logic
  async postWithRetry(
    payload: any,
    options?: AxiosRequestConfig<any>,
    retryLimit = 2,
    timeout = 30000,
    path: string = '',
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

  async get(
    resource: ResourceType,
    options: AxiosRequestConfig,
    id?: string,
  ): Promise<any> {
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

  async getAllResourcesByTask(taskId: string) {
    // Grab bundle for task:
    const { data } = await this.httpService.axiosRef.get<R4.IBundle>(
      `${config.get('fhirServer:baseURL')}/Task`,
      {
        params: {
          _include: '*',
          _id: taskId,
        },
      },
    );

    return data;
  }

  /**
   * Get tasks by patient identifier using _revinclude approach (exact match to working code)
   * @param patientIdentifier Patient identifier value
   * @param identifierSystem Patient identifier system URL
   * @param startTime Start time for search (not used in initial query)
   * @param endTime End time for search (not used in initial query)
   * @returns Bundle containing tasks and related resources
   */
  async getTasksByPatientIdentifier(
    patientIdentifier: string,
    identifierSystem: string,
    startTime: Date,
    endTime: Date
  ): Promise<R4.IBundle> {
    try {
      this.logger.log(`Querying tasks for patient identifier: ${patientIdentifier}`);
      this.logger.log(`Identifier system: ${identifierSystem}`);
      this.logger.log(`Time range: ${startTime.toISOString()} to ${endTime.toISOString()}`);

      // Use the exact same approach as the working code snippet
      const options = {
        timeout: config.get('bwConfig:requestTimeout'),
        searchParams: {
          identifier: `${identifierSystem}|${patientIdentifier}`,
          _revinclude: 'Task:patient',
        },
      };

      let potentialPatientTasks: R4.IBundle;
      try {
        const response = await this.httpService.axiosRef.get<R4.IBundle>(
          `${config.get('fhirServer:baseURL')}/Patient`,
          {
            params: options.searchParams,
            timeout: options.timeout,
          },
        );
        potentialPatientTasks = response.data;
      } catch (e) {
        this.logger.error('Error in FHIR query:', e);
        potentialPatientTasks = { resourceType: 'Bundle' };
      }

      this.logger.log(`Found ${potentialPatientTasks.entry?.length || 0} total resources (patients + tasks)`);

      if (potentialPatientTasks && potentialPatientTasks.entry) {
        // Filter and Sort all resources in entry to have tasks by descending order of creation
        const patientTasks = potentialPatientTasks.entry
          .filter(
            e =>
              e.resource &&
              e.resource.resourceType == 'Task' &&
              e.resource.status == 'received',
          )
          .sort((a, b) => {
            if (a.resource && b.resource) {
              const at = a.resource as R4.ITask;
              const bt = b.resource as R4.ITask;

              return new Date(bt.authoredOn || 0).getTime() - new Date(at.authoredOn || 0).getTime();
            }
            return 0;
          });

        this.logger.log(`Found ${patientTasks.length} tasks with 'received' status`);

        // For now, if multiple tasks exist, grab the most recent one and log a warning
        if (patientTasks.length > 1) {
          this.logger.warn(
            `More than one task found for patient with identifier ${patientIdentifier}! Processing most recent.`,
          );
        }

        // Return bundle with filtered tasks
        return {
          ...potentialPatientTasks,
          entry: patientTasks
        };
      } else {
        this.logger.error(
          'Could not find any patient tasks for patient with identifier ' + patientIdentifier + '!',
        );
        return { resourceType: 'Bundle', type: R4.BundleTypeKind._searchset, entry: [] };
      }
    } catch (error) {
      this.logger.error('Error getting tasks by patient identifier:', error);
      this.logger.error('Query parameters:', {
        patientIdentifier,
        identifierSystem,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });
      return { resourceType: 'Bundle', type: R4.BundleTypeKind._searchset, entry: [] };
    }
  }
}
