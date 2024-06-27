import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoggerService } from '../../logger/logger.service';
import config from '../../config';
import { getResourceTypeEnum } from '../utils/fhir';

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

  async saveResource(req: Request, res: Response, operation?: string) {
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
}
