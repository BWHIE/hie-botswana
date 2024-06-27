import { R4 } from '@ahryman40k/ts-fhir-types';
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import fhirClient from 'fhirclient';
import { Observable } from 'rxjs';
import { LoggerService } from 'src/logger/logger.service';
import config from '../../config';
import { FhirService } from '../services/fhir.service';
import { IpsService } from '../services/ips.service';

@Controller('ips')
export class IpsController {
  constructor(
    private readonly fhirService: FhirService,
    private readonly ipsService: IpsService,
    private readonly logger: LoggerService,
  ) {}

  @Get('/')
  getRoot(@Req() req: Request) {
    return req.url;
  }

  @Get('/metadata')
  passThrough(@Req() req: Request, @Res() res: Response): Observable<any> {
    return this.fhirService.passthrough(req, res);
  }

  @Get('/Patient/cruid/:id/:lastUpdated?')
  async getPatientCruidData(
    @Param('id') id: string,
    @Param('lastUpdated') lastUpdated: string,
  ) {
    const shrUrl = config.get('fhirServer:baseURL');
    const shrClient = fhirClient.client({
      serverUrl: shrUrl,
      username: config.get('fhirServer:username'),
      password: config.get('fhirServer:password'),
    });

    this.logger.log(
      'Received a request for an ISP for patient with cruid: %s | lastUpdagted: %s',
      id,
      lastUpdated,
    );

    try {
      const mpiPatients = await shrClient.request(
        `Patient?_id=${id}&_include=Patient:link`,
        { flat: true },
      );

      const system = config.get('app:mpiSystem');
      const ipsBundle = await this.ipsService.generateIpsBundle(
        mpiPatients,
        shrClient,
        lastUpdated,
        system,
      );

      return ipsBundle;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch patient data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/Patient/:id/:lastUpdated?')
  async getPatientData(
    @Param('id') patientId: string,
    @Param('lastUpdated') lastUpdated: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const shrUrl = config.get('fhirServer:baseURL');

    this.logger.log(
      'Received a request for an ISP with a bundle of resources\npatient id: %s | lastUpdagted: %s',
      patientId,
      lastUpdated,
    );

    // Create Client
    const shrClient = fhirClient(req, res).client({
      serverUrl: shrUrl,
      username: config.get('fhirServer:username'),
      password: config.get('fhirServer:password'),
    });

    // Query MPI to get all patients
    const system = config.get('app:mpiSystem');

    // TODO: parameterize identifier specifics and account for diffent types of identifiers
    const goldenRecordRes = await shrClient.request<R4.IPatient[]>(
      `Patient?identifier=${system}|${patientId}&_include=Patient:link`,
      { flat: true },
    );
    const goldenRecord = goldenRecordRes.find(
      (x) =>
        x.meta &&
        x.meta.tag &&
        x.meta.tag[0].code === '5c827da5-4858-4f3d-a50c-62ece001efea',
    );

    if (goldenRecord) {
      const cruid = goldenRecord.id;
      const mpiPatients = await shrClient.request<R4.IPatient[]>(
        `Patient?_id=${cruid}&_include=Patient:link`,
        { flat: true },
      );
      const ipsBundle = await this.ipsService.generateIpsBundle(
        mpiPatients,
        shrClient,
        lastUpdated,
        system,
      );
      return ipsBundle;
    } else {
      throw new InternalServerErrorException();
    }
  }

  @Get('/:location?/:lastUpdated?')
  async getLocationData(
    @Param('location') location: string,
    @Param('lastUpdated') lastUpdated: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const query = new URLSearchParams();
    const obsQuery = new URLSearchParams();

    if (lastUpdated) {
      query.set('_lastUpdated', lastUpdated);
      obsQuery.set('_lastUpdated', lastUpdated);
    }

    this.logger.log(
      'Received a request for an ISP with a bundle of resources\nlocation: %s | lastUpdagted: %s',
      location,
      lastUpdated,
    );

    // Create Client
    const client = fhirClient(req, res).client({
      serverUrl: config.get('fhirServer:baseURL'),
    });

    /**
     * For now:
     * 1. Set lastUpdated and location based on parameters
     * 2. Get all Patients that were lastUpdated and from a given location
     * 3. Get all Encounters that were lastUpdated and from a given location
     * 4. Get all Observations that were lastUpdated and from a given location
     * 5. Combine them into a single bundle w/ composition
     *
     */

    const patientP = client.request<R4.IPatient[]>(`Patient?${query}`, {
      flat: true,
    });

    if (location) {
      query.set('location', location);
      obsQuery.set('encounter.location', location);
    }
    const encounterP = client.request<R4.IEncounter[]>(`Encounter?${query}`, {
      flat: true,
    });
    const obsP = client.request<R4.IObservation[]>(`Observation?${obsQuery}`, {
      flat: true,
    });

    try {
      const values = await Promise.all([patientP, encounterP, obsP]);
      return this.ipsService.generateUpdateBundle(values, location);
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(e);
    }
  }
}
