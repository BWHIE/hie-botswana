import { Inject, Injectable, Logger } from '@nestjs/common';
import { fhirR4 } from '@smile-cdr/fhirts';
import config from 'src/config';
import { MpiService } from '../modules/mpi/services/mpi.service';
import { FhirSearchParams } from 'src/utils/fhir-search.pipe';

@Injectable()
export abstract class BaseService {
  protected readonly logger = new Logger(BaseService.name);

  constructor(
    @Inject(MpiService)
    protected readonly mpi: MpiService,
  ) {}

  public async retrySearchPatient(
    params: FhirSearchParams,
    clientId: string,
  ): Promise<fhirR4.Bundle | null> {
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return this.mpi.searchPatientByIdentifier(params, clientId);
      } catch (error) {
        this.logger.warn(
          `Attempt ${attempt} to get search bundle failed: ${error.message}`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000),
        );
      }
    }

    this.logger.error(
      `All attempts to get search bundle failed after ${maxAttempts} retries. `,
    );
    return null;
  }

  protected needsUpdateOrIsEmpty(searchBundle: fhirR4.Bundle): boolean {
    if (!searchBundle || searchBundle.total === 0) return true;

    const maxDays = Number(config.get('ClientRegistry:maxDaysBeforeUpdate'));
    const lastUpdated = searchBundle.meta?.lastUpdated;
    return (
      lastUpdated &&
      new Date().getTime() - new Date(lastUpdated).getTime() >
        maxDays * 24 * 60 * 60 * 1000
    );
  }
}
