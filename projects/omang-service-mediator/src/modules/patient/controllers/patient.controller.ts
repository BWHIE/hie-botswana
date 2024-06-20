import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Headers,
  Inject,
  InternalServerErrorException,
  Logger,
  Query,
  UseGuards,
} from '@nestjs/common';
import { fhirR4 } from '@smile-cdr/fhirts';
import { MasterPatientIndex } from 'src/modules/mpi/services/mpi';
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
    @Inject(MasterPatientIndex)
    protected readonly mpi: MasterPatientIndex,
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

  @Get('Get')
  @Header('Content-Type', 'application/fhir+json')
  async get(
    @Query('identifier') identifier: string,
    @Query('given') givenNames: string, // Aligned with FHIR search parameters
    @Query('family') lastName: string, // Aligned with FHIR search parameters
    @Query('gender') gender: string,
    @Query('birthdate') birthDate: string,
    @Query('_page') pageNum: number = 1,
    @Query('_count') pageSize: number = 100,
    @Headers('x-openhim-clientid') clientId = 'OmangSvc',
  ): Promise<fhirR4.Bundle> {
    if (identifier) {
      // Search by identifier
      try {
        if (!identifier.includes('|')) {
          throw new BadRequestException();
        }

        const searchBundle =
          await this.patientService.retrySearchPatientByIdentifier(
            identifier,
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
            pageNum,
            pageSize,
          );

          await this.mpi.pushToClientRegistry(result, clientId);
          return result;
        }
      } catch (error) {
        this.logger.error(error);
        throw new InternalServerErrorException();
      }
    } else {
      // Search by demographics
      if (!givenNames && !lastName && !gender && !birthDate) {
        throw new BadRequestException(
          'At least one search parameter must be provided',
        );
      }

      try {
        const bundle = await this.patientService.getPatientByDemographicData(
          givenNames,
          lastName,
          gender,
          birthDate,
          new Pager(pageNum, pageSize),
        );
        return bundle;
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
