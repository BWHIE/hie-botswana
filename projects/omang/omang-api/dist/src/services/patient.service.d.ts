import { ImmigrationService } from './immigration.service';
import { BDRSService } from './bdrs.service';
import { OmangService } from './omang.service';
import { MasterPatientIndex } from './mpi';
import { fhirR4 } from '@smile-cdr/fhirts';
import { Pager } from '../models/omang';
export declare class PatientService {
    private readonly mpi;
    private readonly omang;
    private readonly bdrs;
    private readonly immigration;
    private readonly logger;
    constructor(mpi: MasterPatientIndex, omang: OmangService, bdrs: BDRSService, immigration: ImmigrationService);
    getPatientByFHIRName(name: fhirR4.HumanName): Promise<fhirR4.Bundle>;
    getPatientByFullName(firstName: string, lastName: string, system: string, pager: Pager): Promise<fhirR4.Bundle>;
    getPatientByID(identifier: string, system: string): Promise<fhirR4.Bundle>;
    isOnline(): Promise<boolean>;
}
