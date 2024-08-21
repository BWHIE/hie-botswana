import { R4 } from '@ahryman40k/ts-fhir-types';
import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from 'src/logger/logger.service';
import { FhirService } from '../../common/services/fhir.service';
import { LabWorkflowService } from '../services/lab-workflow.service';
import { MpiService } from '../services/mpi.service';
import { TerminologyService } from '../services/terminology.service';
import { MflService } from '../services/mfl.service';

@Controller('lab')
export class LabController {
  constructor(
    private readonly fhirService: FhirService,
    private readonly labService: LabWorkflowService,
    private readonly mpiService: MpiService,
    private readonly mflService: MflService,
    private readonly terminologyService: TerminologyService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @Put()
  async saveOrder(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-openhim-clientid') clientId = 'ShrMediator',
  ) {
    let labOrderBundle: R4.IBundle;

    this.logger.log('Received a Lab Order bundle to save.');

    // Make sure JSON is parsed
    if (req.is('text/plain')) {
      labOrderBundle = JSON.parse(req.body);
    } else if (req.is('application/json') || req.is('application/fhir+json')) {
      labOrderBundle = req.body;
    } else {
      throw new BadRequestException(`Invalid content type! ${req.headers}`);
    }

    // Validate Bundle
    this.labService.validateBundle(labOrderBundle);

    // Find or create patient in CR
    const patientRecord = await this.mpiService.findOrCreatePatientInCR(
      labOrderBundle,
      clientId,
    );

    labOrderBundle = await this.labService.updateBundleWithPatientFromCR(
      labOrderBundle,
      patientRecord,
    );

    // Temporary measure to sync MFL data until MFL is stable (re-enable HAPI FHIR provisioning from MFL in swarm.sh)
    labOrderBundle = await this.mflService.enrichWithMflData(labOrderBundle);
    // labOrderBundle = this.mflService.mapLocations(labOrderBundle)

    // Map concepts
    labOrderBundle = await this.terminologyService.mapConcepts(labOrderBundle);

    // Save Bundle in FHIR Server
    labOrderBundle = await this.labService.saveBundle(labOrderBundle);

    // Trigger Background Tasks if bundle saved correctly
    if (labOrderBundle) {
      this.labService.handleLabOrder(labOrderBundle);

      return res.status(201).json({
        ...labOrderBundle,
        // Filter out organizations and locations to keep consistency with FHIR standard
        entry: labOrderBundle.entry.filter(
          (e: R4.IBundle_Entry) =>
            !['Location', 'Organization'].includes(e.resource.resourceType),
        ),
      });
    } else {
      throw new BadRequestException(
        'Unable to save the bundle, empty response',
      );
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
