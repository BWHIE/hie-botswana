import { Injectable, Logger, Inject } from '@nestjs/common';
import { MasterPatientIndex } from '../modules/mpi/services/mpi';
import { fhirR4 } from '@smile-cdr/fhirts';
import { ClientRegistry } from '../app-settings.json';

@Injectable()
export abstract class BaseService {
  protected readonly logger = new Logger(BaseService.name);

  constructor(
    @Inject(MasterPatientIndex)
    protected readonly mpi: MasterPatientIndex,
  ) {}

  protected async retryGetSearchBundleAsync(
    searchParams: any,
  ): Promise<fhirR4.Bundle | null> {
    const maxAttempts = 5;
    // let acc = 0;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return this.mpi.getSearchBundle(searchParams);
      } catch (Exception) {
        this.logger.warn(
          `Attempt ${attempt} to get search bundle failed: ${Exception.message}`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000),
        );
      }
    }

    {
    }
    this.logger.error(
      'All attempts to get search bundle failed after ' +
        maxAttempts +
        ' retries.',
    );
    return null;
  }

  protected needsUpdateOrIsEmpty(searchBundle: fhirR4.Bundle): boolean {
    if (!searchBundle || searchBundle.total === 0) return true;

    const maxDays = Number(ClientRegistry.maxDaysBeforeUpdate);
    const lastUpdated = searchBundle.meta?.lastUpdated;
    return (
      lastUpdated &&
      new Date().getTime() - new Date(lastUpdated).getTime() >
        maxDays * 24 * 60 * 60 * 1000
    );
  }
}
