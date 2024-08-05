import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Headers,
  Inject,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { fhirR4 } from '@smile-cdr/fhirts';
import { MpiService } from 'src/modules/mpi/services/mpi.service';
import {
  FhirSearchParamsValidationPipe,
  FhirSearchParams,
} from 'src/utils/fhir-search.pipe';
import { Pager } from 'src/utils/pager';
import { ImmigrationService } from '../../immigration/services/immigration.service';
import { BasicAuthGuard } from '../../user/models/authentification';
import { PatientService } from '../services/patient.service';

@Controller('api/patient')
@UseGuards(BasicAuthGuard)
export class PatientController {
  private readonly logger = new Logger(PatientController.name);

  constructor(
    private readonly immigration: ImmigrationService,
    private readonly patientService: PatientService,
    @Inject(MpiService)
    protected readonly mpi: MpiService,
  ) {}

  @Get('Online')
  async online(): Promise<boolean> {
    try {
      return this.immigration.isOnline();
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * The following endpoint proxies incoming requests to OpenCR
   * to create a patient record. This is a temporary measure until
   * OpenCR fixs the issue of returning an array of outcomes instead
   * of the patient resource being submitted.
   *
   * See issue : https://github.com/intrahealth/client-registry/issues/147
   */
  @Post('Post')
  @Header('Content-Type', 'application/fhir+json')
  async post(
    @Headers('x-openhim-clientid') clientId = 'OmangSvc',
    @Body() body: fhirR4.Patient,
  ) {
    try {
      const result = await this.mpi.createPatient(body, clientId);
      const response = await Promise.all(result.map(({ response }) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_resourceType, id, ..._rest] = response.location.split('/');
          return this.mpi.getPatientById(id, clientId);
        }),
      );
      const patientRecord = response.find(
        (resource) => 'identifier' in resource,
      );
      if (!patientRecord) {
        throw new NotFoundException();
      }

      return patientRecord;
    } catch (err) {
      this.logger.error('Unable to proxy patient create request', err);
      throw new BadRequestException(err.message);
    }
  }

  @Get('Get')
  @Header('Content-Type', 'application/fhir+json')
  async get(
    @Headers('x-openhim-clientid') clientId = 'OmangSvc',
    @Query(new FhirSearchParamsValidationPipe()) queryParams: FhirSearchParams,
  ): Promise<fhirR4.Bundle> {
    const {
      identifier,
      given,
      family,
      gender,
      birthdate,
      _page = 1,
      _count = 25,
    } = queryParams;
    if (identifier) {
      // Search by identifier
      try {
        const searchBundle = await this.patientService.retrySearchPatient(
          { identifier, _page, _count },
          clientId,
        );

        // Return results from client registry, otherwise search in national registries
        if (searchBundle.total > 0) {
          return searchBundle;
        } else {
          const [system, id] = identifier.split('|');
          const result = await this.patientService.getPatientByID(
            id,
            system,
            _page,
            _count,
          );

          // Async push to openCR
          this.mpi.pushToClientRegistry(result, clientId);

          return result;
        }
      } catch (error) {
        this.logger.error(error);
        throw new InternalServerErrorException();
      }
    } else {
      // Search by demographics in both OpenCR and national registries
      try {
        const [openCrBundle, registriesBundle] = await Promise.all([
          this.patientService.retrySearchPatient(
            { identifier, given, family, gender, birthdate, _page, _count },
            clientId,
          ),
          this.patientService.getPatientByDemographicData(
            given,
            family,
            gender,
            birthdate,
            new Pager(_page, _count),
          ),
        ]);

        // Deduplicate
        registriesBundle.entry =
          registriesBundle.entry?.filter((registryEntry) => {
            return !openCrBundle.entry?.find((openCrEntry) => {
              const openCrIdentifiers =
                (openCrEntry.resource as fhirR4.Patient).identifier || [];
              const registryIdentifiers =
                (registryEntry.resource as fhirR4.Patient).identifier || [];
              return registryIdentifiers.some(({ system, value }) =>
                openCrIdentifiers.some(
                  ({ system: s, value: v }) => s === system && v === value,
                ),
              );
            });
          }) || [];
        registriesBundle.total = registriesBundle.entry.length;

        // Async push to OpenCR
        if (registriesBundle.total > 0) {
          this.mpi.pushToClientRegistry(registriesBundle, clientId);
        }

        // Concat results
        openCrBundle.entry = (openCrBundle.entry || []).concat(
          registriesBundle.entry,
        );
        openCrBundle.total = openCrBundle.total + registriesBundle.total;

        return openCrBundle;
      } catch (error) {
        this.logger.error(error);
        throw new InternalServerErrorException();
      }
    }
  }

  @Get('GetPatientByFullName')
  @Header('Content-Type', 'application/fhir+json')
  async getPatientByFullName(
    @Query('givenNames') givenNames: string,
    @Query('lastName') lastName: string,
    @Query('system') system: string,
    @Query('pageNum') pageNum: number = 1,
    @Query('pageSize') pageSize: number = 100,
  ): Promise<fhirR4.Bundle> {
    try {
      const bundle = await this.patientService.getPatientByFullName(
        givenNames,
        lastName,
        system,
        new Pager(pageNum, pageSize),
      );
      return bundle;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
