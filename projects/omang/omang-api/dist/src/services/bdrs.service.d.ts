import { Pager } from "../models/omang";
import { BirthRecord } from "../models/birth-record";
import { DeathRecord } from "../models/death-record";
import { DeathRepository, BirthRepository } from "../data/bdrs-repositories";
import { fhirR4 } from "@smile-cdr/fhirts";
import { MasterPatientIndex } from "./mpi";
export declare class BDRSService {
    private readonly deaths;
    private readonly births;
    private readonly mpi;
    private readonly logger;
    constructor(deaths: DeathRepository, births: BirthRepository, mpi: MasterPatientIndex);
    isOnline(): Promise<boolean>;
    findBirthByFullName(firstName: string, lastName: string, pager: Pager): Promise<BirthRecord[]>;
    findBirthByFullNameFHIR(firstName: string, lastName: string, pager: Pager): Promise<fhirR4.Bundle>;
    findBirthByLastName(LastName: string, pager: Pager): Promise<BirthRecord[]>;
    findBirthsByDate(startDate: Date, endDate: Date, pager: Pager): Promise<BirthRecord[]>;
    findDeathByFullName(firstName: string, lastName: string, pager: Pager): Promise<DeathRecord[]>;
    findDeathByLastName(lastName: string, pager: Pager): Promise<DeathRecord[]>;
    findDeathsByDate(startDate: Date, endDate: Date, pager: Pager): Promise<DeathRecord[]>;
    getDeathByID(ids: string[], pager: Pager): Promise<fhirR4.Bundle>;
    getBirthByID(ids: string[], pager: Pager): Promise<fhirR4.Bundle>;
    private processCrBundle;
}
