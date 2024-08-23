import { R4 } from '@ahryman40k/ts-fhir-types';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { FhirService } from '../../common/services/fhir.service';
import config from '../../config';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class MpiService {
  constructor(
    private readonly fhirService: FhirService,
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {}

  async findOrCreatePatientInCR(labOrderBundle: R4.IBundle, clientId: string) {
    // Find or Create the patient through OpenCR
    const patientResource = labOrderBundle.entry!.find((entry) => {
      return entry.resource && entry.resource.resourceType === 'Patient';
    });

    const thePatient = patientResource?.resource as R4.IPatient;
    if (
      thePatient &&
      Array.isArray(thePatient.identifier) &&
      thePatient.identifier.length > 0
    ) {
      const result = await this.findPatientInCR(thePatient);

      // If patient already exists in CR, update the bundle with patient ref
      let patientRecord: R4.IPatient;
      if (result?.total > 0) {
        patientRecord = result.entry[0].resource as R4.IPatient;
      } else {
        // If patient doesn't exist in CR, create the patient then update th bundle
        patientRecord = await this.createPatientInCR(thePatient, clientId);
      }

      // Something went wrong
      if (!patientRecord) {
        throw new InternalServerErrorException(
          'Unable to find/create a patient record',
        );
      }
      return patientRecord;
    } else {
      this.logger.error('Unable to update CR : No patient found in the bundle');
      throw new BadRequestException(
        'Bundle must contain a patient resource with an identifier',
      );
    }
  }

  async findPatientInCR(thePatient: R4.IPatient) {
    const clientRegistryUrl = config.get('ClientRegistryMediator:apiUrl');
    const identifier = thePatient.identifier[0];
    const { data } = await this.httpService.axiosRef.get<R4.IBundle>(
      `${clientRegistryUrl}/api/Patient/find`,
      {
        params: {
          identifier: `${identifier.system}|${identifier.value}`,
          _tag: thePatient.meta.tag.map(({ system, code }) => {
            return `${system}|${code}`;
          }),
        },
        auth: {
          username: config.get('ClientRegistryMediator:username'),
          password: config.get('ClientRegistryMediator:password'),
        },
      },
    );

    this.logger.debug(`Find Patient in CR Result: ${JSON.stringify(data)}`);
    return data;
  }

  async createPatientInCR(thePatient: R4.IPatient, clientId: string) {
    const clientRegistryUrl = config.get('ClientRegistryMediator:apiUrl');
    const { data } = await this.httpService.axiosRef.post<R4.IPatient>(
      `${clientRegistryUrl}/api/Patient/Post`,
      thePatient,
      {
        headers: {
          'Content-Type': 'application/fhir+json',
          'x-openhim-clientid': clientId,
        },
        auth: {
          username: config.get('ClientRegistryMediator:username'),
          password: config.get('ClientRegistryMediator:password'),
        },
      },
    );

    this.logger.debug(`Create Patient in CR Result: ${JSON.stringify(data)}`);
    return data;
  }

  /**
   * updateCrPatient
   * @param labBundle
   * @returns
   */
  async updateCrPatient(bundle: R4.IBundle): Promise<R4.IBundle> {
    const patResult = bundle.entry!.find((entry) => {
      return entry.resource && entry.resource.resourceType === 'Patient';
    });

    if (patResult) {
      const options: AxiosRequestConfig = {
        timeout: config.get('bwConfig:requestTimeout'),
        data: {},
        auth: {
          username: config.get('mediator:client:username'),
          password: config.get('mediator:client:password'),
        },
      };
      const thePatient = patResult.resource as R4.IPatient;

      const crResult = await this.fhirService.postWithRetry(
        thePatient,
        options,
        config.get('bwConfig:retryCount'),
        config.get('bwConfig:retryDelay'),
        thePatient.resourceType,
      );

      this.logger.debug(
        `CR Patient Update Result: ${JSON.stringify(crResult)}`,
      );
    } else {
      this.logger.error('Unable to update CR : No patient found in the bundle');
    }

    return bundle;
  }

  /**
   *
   * @param labBundle
   * @returns
   */
  async savePimsPatient(labBundle: R4.IBundle): Promise<R4.IBundle> {
    const resultBundle = this.updateCrPatient(labBundle);

    return resultBundle;
  }

  /**
   *
   * @param labBundle
   * @returns
   */
  async saveIpmsPatient(registrationBundle: R4.IBundle): Promise<R4.IBundle> {
    // Save to CR
    const resultBundle = this.updateCrPatient(registrationBundle);

    return resultBundle;
  }
}
