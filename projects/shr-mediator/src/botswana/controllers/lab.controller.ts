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
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { LoggerService } from 'src/logger/logger.service';
import { FhirService } from '../../common/services/fhir.service';
import { invalidBundle, invalidBundleMessage } from '../../common/utils/fhir';
import { LabWorkflowService } from '../services/lab-workflow.service';
import config from '../../config';

@Controller('lab')
export class LabController {
  constructor(
    private readonly fhirService: FhirService,
    private readonly labService: LabWorkflowService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @Put()
  async saveOrder(@Req() req: Request, @Res() res: Response) {
    try {
      let orderBundle: R4.IBundle;
      this.logger.log('Received a Lab Order bundle to save.');

      // Make sure JSON is parsed
      if (req.is('text/plain')) {
        orderBundle = JSON.parse(req.body);
      } else if (
        req.is('application/json') ||
        req.is('application/fhir+json')
      ) {
        orderBundle = req.body;
      } else {
        throw new BadRequestException(`Invalid content type! ${req.headers}`);
      }

      // Validate Bundle
      if (invalidBundle(orderBundle)) {
        return res.status(400).json(invalidBundleMessage());
      }

      // Save Bundle
      const resultBundle: R4.IBundle =
        await this.labService.saveBundle(orderBundle);

      // Trigger Background Tasks if bundle saved correctly
      if (
        resultBundle &&
        resultBundle.entry &&
        orderBundle.entry &&
        resultBundle.entry.length == orderBundle.entry.length
      ) {
        this.labService.handleLabOrder(orderBundle);
        return resultBundle;
      } else {
        throw new BadRequestException(resultBundle);
      }
    } catch (e) {
      this.logger.error(`Error saving bundle: ${e}`);
      throw new InternalServerErrorException("Couldn't save bundle!");
    }
  }

  @Get('/metadata')
  passThrough(@Req() req: Request, @Res() res: Response): Observable<any> {
    return this.fhirService.passthrough(req, res, '/metadata');
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
