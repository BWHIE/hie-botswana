import {
  Controller,
  Get,
  Query,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { Pager } from '../../../utils/pager';
import { ImmigrationService } from '../../immigration/services/immigration.service';
import { PatientService } from '../services/patient.service';
import { fhirR4 } from '@smile-cdr/fhirts';
import { BasicAuthGuard } from '../../user/models/authentification';

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
    } catch (ex) {
      this.logger.error(ex);
      throw new InternalServerErrorException();
    }
  }

  @Get('Get')
  async get(@Query('identifier') identifier: string): Promise<fhirR4.Bundle> {
    try {
      if (!identifier || !identifier.includes('|')) {
        throw new BadRequestException();
      }

      const [system, id] = identifier.split('|');
      const result = await this.patients.getPatientByID(id, system);
      return result;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Get('GetByID')
  async getByID(@Query('ID') ID: string): Promise<fhirR4.Bundle> {
    try {
      if (!ID) {
        throw new BadRequestException();
      }

      const bundle = await this.immigration.getPatientByPassportNumber(ID, {
        pageNum: 1,
        pageSize: 1,
      });
      return bundle;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Get('GetPatientByFullName')
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
}
