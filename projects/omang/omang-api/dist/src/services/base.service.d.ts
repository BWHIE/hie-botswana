import { Logger } from '@nestjs/common';
import { MasterPatientIndex } from './mpi';
import { fhirR4 } from '@smile-cdr/fhirts';
export declare abstract class BaseService {
    protected readonly mpi: MasterPatientIndex;
    protected readonly logger: Logger;
    constructor(mpi: MasterPatientIndex);
    protected retryGetSearchBundleAsync(searchParams: any): Promise<fhirR4.Bundle | null>;
    protected needsUpdateOrIsEmpty(searchBundle: fhirR4.Bundle): boolean;
}
