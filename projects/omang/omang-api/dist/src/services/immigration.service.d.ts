import { Logger } from '@nestjs/common';
import { fhirR4 } from '@smile-cdr/fhirts';
import { ImmigrationRepository } from '../data/immigration-repository';
import { ImmigrationRecord } from '../models/immigration-record';
import { Pager } from '../models/omang';
import { BaseService } from './base.service';
import { MasterPatientIndex } from './mpi';
export declare class ImmigrationService extends BaseService {
    private readonly repo;
    protected readonly mpi: MasterPatientIndex;
    protected readonly logger: Logger;
    constructor(repo: ImmigrationRepository, mpi: MasterPatientIndex);
    getPatientByPassportNumber(ppn: string, pager: Pager): Promise<fhirR4.Bundle>;
    findByBirthDate(startDate: Date, endDate: Date, pager: Pager): Promise<ImmigrationRecord[]>;
    findByCountry(country: string, pager: Pager): Promise<ImmigrationRecord[]>;
    findByEntryDate(startDate: Date, endDate: Date, pager: Pager): Promise<ImmigrationRecord[]>;
    findByPassportExpiryDate(startDate: Date, endDate: Date, pager: Pager): Promise<ImmigrationRecord[]>;
    findBySex(sex: string, pager: Pager): Promise<ImmigrationRecord[]>;
    getByFullNameNonFHIR(firstName: string, lastName: string, pager: Pager): Promise<ImmigrationRecord[]>;
    getByFullName(firstName: string, lastName: string, pager: Pager): Promise<fhirR4.Bundle>;
    getByLastName(lastName: string, pager: Pager): Promise<ImmigrationRecord[]>;
    getByPassportNo(passportNo: string[], pager: Pager): Promise<ImmigrationRecord[]>;
    isOnline(): Promise<boolean>;
    private updateClientRegistryAsync;
}
