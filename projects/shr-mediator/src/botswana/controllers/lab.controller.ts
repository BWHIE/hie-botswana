import { R4 } from '@ahryman40k/ts-fhir-types';
import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Put,
  Req,
  Res,
  Headers,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from 'src/logger/logger.service';
import { FhirService } from '../../common/services/fhir.service';
import { invalidBundle } from '../../common/utils/fhir';
import { LabWorkflowService } from '../services/lab-workflow.service';
import { MpiService } from '../services/mpi.service';

@Controller('lab')
export class LabController {
  constructor(
    private readonly fhirService: FhirService,
    private readonly labService: LabWorkflowService,
    private readonly mpiService: MpiService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @Put()
  async saveOrder(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-openhim-clientid') clientId = 'ShrMediator',
  ) {
    try {
      let labOrderBundle: R4.IBundle;

      this.logger.log('Received a Lab Order bundle to save.');

      // Make sure JSON is parsed
      if (req.is('text/plain')) {
        labOrderBundle = JSON.parse(req.body);
      } else if (
        req.is('application/json') ||
        req.is('application/fhir+json')
      ) {
        labOrderBundle = req.body;
      } else {
        throw new BadRequestException(`Invalid content type! ${req.headers}`);
      }

      // Validate Bundle
      if (invalidBundle(labOrderBundle)) {
        throw new BadRequestException('Invalid bundle submitted');
      }

      const patientRecord = await this.mpiService.findOrCreatePatientInCR(
        labOrderBundle,
        clientId,
      );

      labOrderBundle = await this.labService.updateBundleWithPatientFromCR(
        labOrderBundle,
        patientRecord,
      );

      // Save Bundle in FHIR Server
      const resultBundle = await this.labService.saveBundle(labOrderBundle);

      // Trigger Background Tasks if bundle saved correctly
      if (
        resultBundle &&
        resultBundle.entry &&
        labOrderBundle.entry &&
        resultBundle.entry.length == labOrderBundle.entry.length
      ) {
        this.labService.handleLabOrder(labOrderBundle);
        return res.status(201).json(resultBundle);
      } else {
        throw new BadRequestException(resultBundle);
      }
    } catch (e) {
      this.logger.error(`Error saving bundle: ${e}`);
      throw new InternalServerErrorException("Couldn't save bundle!");
    }
  }

  @Get('/metadata')
  async passThrough(@Req() req: Request, @Res() res: Response): Promise<any> {
    return this.fhirService.passthrough(req, res, 'metadata');
  }

  @Get('/orders/target/:facilityId/:_lastUpdated?')
  getActiveOrderTargetFacility(@Req() req: Request) {
    return req.url;
  }
  @Get('/orders/source/:facilityId/:_lastUpdated?')
  getActiveOrderSourceFacility(@Req() req: Request) {
    return req.url;
  }
}
