import { ConfigService } from '@nestjs/config';
import { AppService } from '../app.service';
export declare class MediatorService {
    private readonly configService;
    private readonly appService;
    constructor(configService: ConfigService, appService: AppService);
    start(callback: any): Promise<void>;
    private static registrationCallback;
    private static setupCallback;
    private static startupCallback;
    private static updateCallback;
    private static reloadConfig;
}
