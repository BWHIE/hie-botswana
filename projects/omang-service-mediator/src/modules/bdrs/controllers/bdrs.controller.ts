import {
  Controller,
  Get,
  Query,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { Pager } from 'src/utils/pager';
import { BDRSService } from '../services/bdrs.service';
import { BasicAuthGuard } from '../../user/models/authentification';

@Controller('api/bdrs')
@UseGuards(BasicAuthGuard)
export class BDRSController {
  private readonly logger = new Logger('BDRSController');

  constructor(private readonly bdrsService: BDRSService) {}

  @Get('Online')
  async online(): Promise<boolean> {
    try {
      return await this.bdrsService.isOnline();
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Get('GetByID')
  async getBirthByID(
    @Query('ID') ID: string[],
    @Query('pageNum') pageNum: number = 1,
    @Query('pageSize') pageSize: number = 100,
  ): Promise<any> {
    try {
      if (!ID || ID.length === 0) {
        throw new BadRequestException('ID parameter is required');
      }
      const idArray = Array.isArray(ID) ? ID : [ID];
      const bundle = await this.bdrsService.getBirthByID(
        idArray,
        new Pager(pageNum, pageSize),
      );
      return bundle;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Get('GetDeathByID')
  async getDeathByID(
    @Query('ID') ID: string[],
    @Query('pageNum') pageNum: number = 1,
    @Query('pageSize') pageSize: number = 100,
  ): Promise<any> {
    try {
      if (!ID || ID.length === 0) {
        throw new BadRequestException('ID parameter is required');
      }

      const idArray = Array.isArray(ID) ? ID : [ID];
      const bundle = await this.bdrsService.getDeathByID(
        idArray,
        new Pager(pageNum, pageSize),
      );
      return bundle;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Get('FindBirthByFullName')
  async findBirthByFullName(
    @Query('givenNames') givenNames: string,
    @Query('lastName') lastName: string,
    @Query('pageNum') pageNum: number = 1,
    @Query('pageSize') pageSize: number = 100,
  ): Promise<any> {
    try {
      if (!givenNames || !lastName) {
        throw new BadRequestException(
          'Both givenNames and lastName parameters are required',
        );
      }

      // Trim white space from left and right of the names
      givenNames = givenNames.trim();
      lastName = lastName.trim();

      const result = await this.bdrsService.findBirthByFullName(
        givenNames,
        lastName,
        new Pager(pageNum, pageSize),
      );
      if (result) {
        return result;
      } else {
        return `No record with Name '${givenNames} ${lastName}' found.`;
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Get('FindDeathByFullName')
  async findDeathByFullName(
    @Query('givenNames') givenNames: string,
    @Query('lastName') lastName: string,
    @Query('pageNum') pageNum: number = 1,
    @Query('pageSize') pageSize: number = 100,
  ): Promise<any> {
    try {
      if (!givenNames || !lastName) {
        throw new BadRequestException(
          'Both givenNames and lastName parameters are required',
        );
      }

      // Trim white space from left and right of the names
      givenNames = givenNames.trim();
      lastName = lastName.trim();

      const result = await this.bdrsService.findDeathByFullName(
        givenNames,
        lastName,
        new Pager(pageNum, pageSize),
      );
      if (result) {
        return result;
      } else {
        return `No record with Name '${givenNames} ${lastName}' found.`;
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Get('FindBirthByLastName')
  async findBirthByLastName(
    @Query('lastName') LastName: string,
    @Query('pageNum') pageNum: number = 1,
    @Query('pageSize') pageSize: number = 100,
  ): Promise<any> {
    try {
      if (!LastName) {
        throw new BadRequestException('lastName parameter is required');
      }

      // Trim white space from left and right of the name
      LastName = LastName.trim();

      const result = await this.bdrsService.findBirthByLastName(
        LastName,
        new Pager(pageNum, pageSize),
      );
      if (result) {
        return result;
      } else {
        return `No record with LastName '${LastName}' found.`;
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Get('FindDeathByLastName')
  async findDeathByLastName(
    @Query('lastName') lastName: string,
    @Query('pageNum') pageNum: number = 1,
    @Query('pageSize') pageSize: number = 100,
  ): Promise<any> {
    try {
      if (!lastName) {
        throw new BadRequestException('lastName parameter is required');
      }

      // Trim white space from left and right of the name
      lastName = lastName.trim();

      const result = await this.bdrsService.findDeathByLastName(
        lastName,
        new Pager(pageNum, pageSize),
      );
      if (result) {
        return result;
      } else {
        return `No record with LastName '${lastName}' found.`;
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Get('BirthsByDate')
  async birthsByDate(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('pageNum') pageNum: number = 1,
    @Query('pageSize') pageSize: number = 100,
  ): Promise<any> {
    try {
      if (!startDate) {
        throw new BadRequestException('startDate parameter is required');
      }
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();

      const result = await this.bdrsService.findBirthsByDate(
        start,
        end,
        new Pager(pageNum, pageSize),
      );
      if (result) {
        return result;
      } else {
        return 'No record with parameters provided found.';
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Get('DeathsByDate')
  async deathsByDate(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('pageNum') pageNum: number = 1,
    @Query('pageSize') pageSize: number = 100,
  ): Promise<any> {
    try {
      if (!startDate) {
        throw new BadRequestException('startDate parameter is required');
      }

      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      const result = await this.bdrsService.findDeathsByDate(
        start,
        end,
        new Pager(pageNum, pageSize),
      );
      if (result) {
        return result;
      } else {
        return 'No record with parameters provided found.';
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
