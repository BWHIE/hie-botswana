import { R4 } from '@ahryman40k/ts-fhir-types';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { FhirService } from '../../common/services/fhir.service';
import config from '../../config';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class MpiService {
  constructor(
    private readonly fhirService: FhirService,
    private readonly logger: LoggerService,
  ) {}

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
      const thePatient = patResult.resource as R4.IPatient

      const crResult = await this.fhirService.postWithRetry(
        thePatient,
        options,
        config.get('bwConfig:retryCount'),
        config.get('bwConfig:retryDelay'),
        thePatient.resourceType
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
