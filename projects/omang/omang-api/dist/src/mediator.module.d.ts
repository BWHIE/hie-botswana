import { OnApplicationBootstrap, Logger } from '@nestjs/common';
import { MediatorService } from './mediator/mediator.service';
export declare class MediatorModule implements OnApplicationBootstrap {
    private readonly mediatorService;
    logger: Logger;
    constructor(mediatorService: MediatorService);
    onApplicationBootstrap(): Promise<void>;
}
