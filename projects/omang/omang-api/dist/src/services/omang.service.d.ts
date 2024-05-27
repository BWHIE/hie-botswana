import { Logger } from "@nestjs/common";
import { Pager } from "../models/omang";
import { OmangRepository } from "../data/omang-repository";
import { fhirR4 } from "@smile-cdr/fhirts";
import { Omang } from "../models/omang";
import { BaseService } from "./base.service";
import { MasterPatientIndex } from "./mpi";
export declare class OmangService extends BaseService {
    private readonly repo;
    protected readonly mpi: MasterPatientIndex;
    protected readonly logger: Logger;
    constructor(repo: OmangRepository, mpi: MasterPatientIndex);
    getOmangByID(ID: string[], pager: Pager): Promise<fhirR4.Bundle>;
    isOnline(): Promise<Boolean>;
    findOmangByChangeDate(changeStartDate: Date, changeEndDate: Date, pager: Pager): Promise<fhirR4.Bundle>;
    findOmangByChangeDateNonFHIR(changeStartDate: Date, changeEndDate: Date, pager: Pager): Promise<Omang[]>;
    findOmangByDeceasedDate(deceasedStartDate: Date, deceasedEndDate: Date, pager: Pager): Promise<fhirR4.Bundle>;
    findOmangByDeceasedDateNonFHIR(deceasedStartDate: Date, deceasedEndDate: Date, pager: Pager): Promise<Omang[]>;
    findOmangByFullName(firstName: string, lastName: string, pager: Pager): Promise<fhirR4.Bundle>;
    findOmangByFullNameNonFHIR(firstName: string, lastName: string, pager: Pager): Promise<Omang[]>;
    findOmangByLastName(lastName: string, pager: Pager): Promise<fhirR4.Bundle>;
    findOmangByLastNameNonFHIR(lastName: string, pager: Pager): Promise<Omang[]>;
    getOmangByIDNonFHIR(ID: string[], pager: Pager): Promise<Omang[]>;
    private updateClientRegistryAsync;
}
