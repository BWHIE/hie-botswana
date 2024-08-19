import { R4 } from '@ahryman40k/ts-fhir-types';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from 'src/logger/logger.service';
import * as URI from 'urijs';
import { FhirService } from '../services/fhir.service';
import { IpsService } from '../services/ips.service';
import {
  getResourceTypeEnum,
  invalidBundle,
  isValidResourceType,
} from '../utils/fhir';

@Controller('fhir')
export class FhirController {
  constructor(
    private readonly fhirService: FhirService,
    private readonly ipsService: IpsService,
    private readonly logger: LoggerService,
  ) {}

  @Get('/')
  getRoot(@Req() req: Request) {
    return req.url;
  }

  @Get('/metadata')
  async passThrough(@Req() req: Request, @Res() res: Response): Promise<any> {
    return this.fhirService.passthrough(req, res, '/metadata');
  }

  @Get(':resource/:id?/:operation?')
  async handleRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Param('operation') operation: string,
  ) {
    try {
      let path = URI();

      if (isValidResourceType(req.params.resource)) {
        path = path.segment(
          getResourceTypeEnum(req.params.resource).toString(),
        );
      } else {
        throw new BadRequestException(
          `Invalid resource type ${req.params.resource}`,
        );
      }

      if (req.params.id && /^[a-zA-Z0-9\-_]+$/.test(req.params.id)) {
        path = path.segment(encodeURIComponent(req.params.id));
      } else {
        this.logger.log(
          `Invalid id ${req.params.id} - falling back on pass-through to HAPI FHIR server`,
        );
        return this.fhirService.passthrough(req, res, req.url);
      }

      for (const param in req.query) {
        const value = req.query[param];
        if (value && /^[a-zA-Z0-9\-_]+$/.test(value.toString())) {
          path.addQuery(param, encodeURIComponent(value.toString()));
        } else {
          this.logger.log(
            `Invalid query parameter ${param}=${value} - falling back on pass-through to HAPI FHIR server`,
          );
          return this.fhirService.passthrough(req, res, req.url);
        }
      }

      this.logger.log(`Getting ${path.toString()}`);

      if (
        id &&
        resource == 'Patient' &&
        (id == '$summary' || operation == '$summary')
      ) {
        // Handle IPS Generation.

        if (id && id.length > 0 && id[0] != '$') {
          // ** If using logical id of the Patient object, create summary from objects directly connected to the patient.
          return await this.ipsService.generateSimpleIpsBundle(req.params.id);
        } else if (id == '$summary') {
          /**
           * If not using logical id, use the Client Registry to resolve patient identity:
           * 1. Each time a Patient Object is Created or Updated, a copy is sent to the attached CR
           * 2. Assumption: The CR is set up to correctly match the Patient to other sources.
           * 3. When IPS is requested with an identifier query parameter and no logical id parameter:
           *   a. The Client Registry is queried with an $ihe-pix request to get identifiers cross-referenced with the given identifier.
           *   b. All Patient IDs from the SHR are filtered (in query or post-process)
           *   c. Patient data is composed of multiple patient resources, the golden record resource, and all owned data
           * */
        } else {
          // Unsupported Operation
          throw new InternalServerErrorException('Unsupported Operation');
        }
      } else {
        return this.fhirService.passthrough(req, res, path.toString());
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Post('/')
  async postBundle(
    @Body() bundle: R4.IBundle,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(
        'Received a request to add a bundle of resources',
        bundle,
      );

      // Verify the bundle
      if (invalidBundle(bundle) || bundle.entry.length === 0) {
        throw new BadRequestException('Invalid bundle submitted');
      }

      return this.fhirService.passthrough(req, res, '');
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  @Post('/:resourceType')
  async createResource(@Req() req: Request, @Res() res: Response) {
    return await this.fhirService.saveResource(req, res);
  }

  @Put('/:resourceType/:id')
  async updateResource(@Req() req: Request, @Res() res: Response) {
    return await this.fhirService.saveResource(req, res);
  }
}
