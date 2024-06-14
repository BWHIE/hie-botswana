import {
  Controller,
  Get,
  Query,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  UseGuards,
  Header,Headers
} from '@nestjs/common';
import { Pager } from 'src/utils/pager';
import { ImmigrationService } from '../../immigration/services/immigration.service';
import { PatientService } from '../services/patient.service';
import { fhirR4 } from '@smile-cdr/fhirts';
import { BasicAuthGuard } from '../../user/models/authentification';
import config from 'src/config';

@Controller('api/patient')
@UseGuards(BasicAuthGuard)
export class PatientController {
  private readonly logger = new Logger(PatientController.name);

  constructor(
    private readonly immigration: ImmigrationService,
    private readonly patients: PatientService,
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
  async get(@Query('identifier') identifier: string,
  @Headers('x-openhim-clientid') clientId = 'OmangSvc'): Promise<fhirR4.Bundle> {
    try {
      if (!identifier || !identifier.includes('|')) {
        throw new BadRequestException();
      }

      const [system, id] = identifier.split('|');
      const result = await this.patients.getPatientByID(id, system);
      await this.patients.updateClientRegistryAsync(
        result,
        [id],
        system,clientId
      );
      return result;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Get('GetByID')
  @Header('Content-Type', 'application/fhir+json')
  async getByID(@Query('ID') ID: string[],   
   @Headers('x-openhim-clientid') clientId = 'OmangSvc'): Promise<fhirR4.Bundle> {

    try {
      if (!ID) {
        throw new BadRequestException();
      }

      const idArray = Array.isArray(ID) ? ID : [ID];
      const bundle = await this.immigration.getPatientByPassportNumber(idArray, {
        pageNum: 1,
        pageSize: 1,
      });
      await this.immigration.updateClientRegistryAsync(
        bundle,
        idArray,
        config.get('ClientRegistry:ImmigrationSystem'),clientId);
      return bundle;

    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
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
      const bundle = await this.patients.getPatientByFullName(
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

  @Get('GetPatientByDemographicData')
  @Header('Content-Type', 'application/fhir+json')
  async getPatientByDemographicData(
    @Query('givenNames') givenNames: string,
    @Query('lastName') lastName: string,
    @Query('gender') gender: string,
    @Query('birthDate') birthDate: string,
    @Query('pageNum') pageNum: number = 1,
    @Query('pageSize') pageSize: number = 100,
  ): Promise<fhirR4.Bundle> {
    try {
      const bundle = await this.patients.getPatientByDemographicData(
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

