import { OmangService } from 'src/services/omang.service';
export declare class OmangController {
    private readonly omang;
    private readonly logger;
    constructor(omang: OmangService);
    online(): Promise<Boolean>;
    getByID(ID: string[], pageNum?: number, pageSize?: number): Promise<any>;
    getByIDNonFHIR(ID: string[], pageNum?: number, pageSize?: number): Promise<any>;
    findByFullName(givenNames: string, lastName: string, pageSize?: number, pageNum?: number): Promise<any>;
    findByFullNameNonFHIR(givenNames: string, lastName: string, pageSize?: number, pageNum?: number): Promise<any>;
    findByLastName(lastName: string, pageSize?: number, pageNum?: number): Promise<any>;
    findByLastNameNonFHIR(lastName: string, pageSize?: number, pageNum?: number): Promise<any>;
    findDeceasedNonFHIR(startDate: string, endDate: string, pageNum?: number, pageSize?: number): Promise<any>;
    findChangedNonFHIR(startDate: string, endDate: string, pageNum?: number, pageSize?: number): Promise<any>;
    findChangedFHIR(startDate: string, endDate: string, pageNum?: number, pageSize?: number): Promise<any>;
    findDeceasedFHIR(startDate: string, endDate: string, pageNum?: number, pageSize?: number): Promise<any>;
}
