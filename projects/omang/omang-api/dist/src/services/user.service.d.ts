import { Logger } from '@nestjs/common';
import { User } from '../models/authentification';
export declare class UserService {
    logger: Logger;
    constructor();
    authenticate(username: string, password: string): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
}
