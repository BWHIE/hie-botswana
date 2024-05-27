import { Controller, Get, Query, Logger, BadRequestException, InternalServerErrorException, UseGuards } from '@nestjs/common';
import { Pager } from 'src/models/omang';
import { OmangService } from 'src/services/omang.service';
import { BasicAuthGuard } from 'src/models/authentification';
import { IpWhitelistGuard } from 'src/models/middlewares';

@Controller('api/omang')
@UseGuards(BasicAuthGuard)
export class OmangController {
  private readonly logger = new Logger(OmangController.name);

  constructor(
    private readonly omang: OmangService,
  ) {}

  @Get('Online')
  async online(): Promise<Boolean> {
    try {
      return this.omang.isOnline();
    } catch (ex) {
      this.logger.error(ex);
      throw new InternalServerErrorException();
    }
  }

  @Get('GetByID')
  async getByID(
    @Query('ID') ID: string[],
    @Query('pageNum') pageNum = 1,
    @Query('pageSize') pageSize = 100,
  ): Promise<any> {
    try {
      if (!ID || ID.length === 0) {
        throw new BadRequestException('ID parameter is required');
    }
      const idArray = Array.isArray(ID) ? ID : [ID];
      const bundle = await this.omang.getOmangByID(idArray, new Pager(pageNum, pageSize));
      return bundle;

    } catch (ex) {
      this.logger.error(ex);
      throw new InternalServerErrorException();
    }
  }

  @Get('GetByIDNonFHIR')
  async getByIDNonFHIR(
    @Query('ID') ID: string[],
    @Query('pageNum') pageNum = 1,
    @Query('pageSize') pageSize = 100,
  ): Promise<any> {
    try {
      if (!ID || ID.length === 0) {
        throw new BadRequestException();
      }

      const idArray = Array.isArray(ID) ? ID : [ID];
      const result = await this.omang.getOmangByIDNonFHIR(idArray, new Pager(pageNum, pageSize));

      if (result) {
        return result;
      } else {
        return `No record with ID '${ID}' found.`;
      }
    } catch (ex) {
      this.logger.error(ex);
      throw new InternalServerErrorException();
    }
  }

  @Get('findByFullName')
  async findByFullName(
    @Query('givenNames') givenNames: string,
    @Query('lastName') lastName: string,
    @Query('pageSize') pageSize = 100,
    @Query('pageNum') pageNum = 1,
  ): Promise<any> {
    try {
      if (!lastName || !givenNames) {
        throw new BadRequestException();
      }

      givenNames = givenNames.trim();
      lastName = lastName.trim();
      
      const bundle = await this.omang.findOmangByFullName(givenNames, lastName, new Pager(pageNum, pageSize));
      return bundle;
    } catch (ex) {
      this.logger.error(ex);
      throw new InternalServerErrorException();
    }
  }

  @Get('FindByFullNameNonFHIR')
  async findByFullNameNonFHIR(
    @Query('givenNames') givenNames: string,
    @Query('lastName') lastName: string,
    @Query('pageSize') pageSize = 100,
    @Query('pageNum') pageNum = 1,
  ): Promise<any> {
    try {
      if (!lastName || !givenNames) {
        throw new BadRequestException();
      }

      givenNames = givenNames.trim();
      lastName = lastName.trim();

      const result = await this.omang.findOmangByFullNameNonFHIR(givenNames, lastName, new Pager(pageNum, pageSize));

      if (result) {
        return result;
      } else {
        return `No record with full name '${lastName}' '${givenNames}' found.`;
      }
    } catch (ex) {
      this.logger.error(ex);
      throw new InternalServerErrorException();
    }
  }

  @Get('FindByLastName')
  async findByLastName(
    @Query('lastName') lastName: string,
    @Query('pageSize') pageSize = 100,
    @Query('pageNum') pageNum = 1,
  ): Promise<any> {
    try {
      if (!lastName) {
        throw new BadRequestException();
      }

      lastName = lastName.trim();
      const bundle = await this.omang.findOmangByLastName(lastName, new Pager(pageNum, pageSize));
      return bundle;

    } catch (ex) {
      this.logger.error(ex);
      throw new InternalServerErrorException();
    }
  }

  @Get('FindByLastNameNonFHIR')
  async findByLastNameNonFHIR(
    @Query('lastName') lastName: string,
    @Query('pageSize') pageSize = 100,
    @Query('pageNum') pageNum = 1,
  ): Promise<any> {
    try {
      if (!lastName) {
        throw new BadRequestException();
      }

      lastName = lastName.trim();

      const result = await this.omang.findOmangByLastNameNonFHIR(lastName, new Pager(pageNum, pageSize));

      if (result) {
        return result;
      } else {
        return `No record with last name '${lastName}' found.`;
      }
    } catch (ex) {
      this.logger.error(ex);
      throw new InternalServerErrorException();
    }
  }

  @Get('DeceasedNonFHIR')
   async findDeceasedNonFHIR(
        @Query('deceasedStartDate') startDate: string,
        @Query('deceasedEndDate') endDate: string,
        @Query('pageNum') pageNum: number = 1,
        @Query('pageSize') pageSize: number = 100,
    ): Promise<any> {
        try {
            if (!startDate) {
                throw new BadRequestException('startDate parameter is required');
            }
            let start = new Date(startDate);
            let end = endDate ? new Date(endDate) : new Date();

            const result = await this.omang.findOmangByDeceasedDateNonFHIR(start, end, new Pager(pageNum, pageSize));
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


    @Get('ChangedNonFHIR')
    async findChangedNonFHIR(
        @Query('changeStartDate') startDate: string,
        @Query('changeEndDate') endDate: string,
        @Query('pageNum') pageNum: number = 1,
        @Query('pageSize') pageSize: number = 100,
    ): Promise<any> {
        try {
            if (!startDate) {
                throw new BadRequestException('startDate parameter is required');
            }
            let start = new Date(startDate);
            let end = endDate ? new Date(endDate) : new Date();

            const result = await this.omang.findOmangByChangeDateNonFHIR(start, end, new Pager(pageNum, pageSize));
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

    @Get('Changed')
    async findChangedFHIR(
        @Query('changeStartDate') startDate: string,
        @Query('changeEndDate') endDate: string,
        @Query('pageNum') pageNum: number = 1,
        @Query('pageSize') pageSize: number = 100,
    ): Promise<any> {
        try {
            if (!startDate) {
                throw new BadRequestException('startDate parameter is required');
            }
            let start = new Date(startDate);
            let end = endDate ? new Date(endDate) : new Date();

            const result = await this.omang.findOmangByChangeDate(start, end, new Pager(pageNum, pageSize));
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


    @Get('Deceased')
    async findDeceasedFHIR(
        @Query('deceasedStartDate') startDate: string,
        @Query('deceasedEndDate') endDate: string,
        @Query('pageNum') pageNum: number = 1,
        @Query('pageSize') pageSize: number = 100,
    ): Promise<any> {
        try {
            if (!startDate) {
                throw new BadRequestException('startDate parameter is required');
            }
            let start = new Date(startDate);
            let end = endDate ? new Date(endDate) : new Date();

            const result = await this.omang.findOmangByDeceasedDate(start, end, new Pager(pageNum, pageSize));
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