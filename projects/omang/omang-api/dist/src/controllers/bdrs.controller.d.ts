import { BDRSService } from '../services/bdrs.service';
export declare class BDRSController {
    private readonly bdrsService;
    private readonly logger;
    constructor(bdrsService: BDRSService);
    online(): Promise<boolean>;
    getBirthByID(ID: string[], pageNum?: number, pageSize?: number): Promise<any>;
    getDeathByID(ID: string[], pageNum?: number, pageSize?: number): Promise<any>;
    findBirthByFullName(givenNames: string, lastName: string, pageNum?: number, pageSize?: number): Promise<any>;
    findDeathByFullName(givenNames: string, lastName: string, pageNum?: number, pageSize?: number): Promise<any>;
    findBirthByLastName(LastName: string, pageNum?: number, pageSize?: number): Promise<any>;
    findDeathByLastName(lastName: string, pageNum?: number, pageSize?: number): Promise<any>;
    birthsByDate(startDate: string, endDate: string, pageNum?: number, pageSize?: number): Promise<any>;
    deathsByDate(startDate: string, endDate: string, pageNum?: number, pageSize?: number): Promise<any>;
}
