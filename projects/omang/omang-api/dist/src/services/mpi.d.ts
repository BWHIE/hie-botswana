import { HttpService } from '@nestjs/axios';
export declare class MasterPatientIndex {
    private readonly httpService;
    private readonly logger;
    private readonly clientRegistryUrl;
    private readonly authHeader;
    private readonly devMode;
    constructor(httpService: HttpService);
    private getHttpOptions;
    getSearchBundle(query: any): Promise<any>;
    createPatient(patient: any): Promise<any>;
}
