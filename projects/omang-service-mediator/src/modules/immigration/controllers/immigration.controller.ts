import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Headers,
  InternalServerErrorException,
  Logger,
  Query,
  UseGuards,
} from '@nestjs/common';
import { fhirR4 } from '@smile-cdr/fhirts';
import { BasicAuthGuard } from '../../user/models/authentification';
import { ImmigrationService } from '../services/immigration.service';

@Controller('api/immigration')
@UseGuards(BasicAuthGuard)
export class ImmigrationController {
  private readonly logger = new Logger(ImmigrationController.name);

  constructor(private readonly immigration: ImmigrationService) {}

  @Get('Online')
  async online(): Promise<boolean> {
    try {
      return this.immigration.isOnline();
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Get('GetByID')
  @Header('Content-Type', 'application/fhir+json')
  async getByID(
    @Query('ID') id: string[],
    @Headers('x-openhim-clientid') clientId = 'OmangSvc',
  ): Promise<fhirR4.Bundle> {
    try {
      if (!id) {
        throw new BadRequestException();
      }

      const idArray = Array.isArray(id) ? id : [id];
      const bundle = await this.immigration.getPatientByPassportNumber(
        idArray,
        {
          pageNum: 1,
          pageSize: 1,
        },
      );
      return bundle;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
