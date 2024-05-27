import { ExecutionContext, CanActivate } from '@nestjs/common';
import { UserService } from '../services/user.service';
export declare class User {
    id: number;
    username: string;
    password: string;
    constructor(id: number, username: string, password: string);
}
export declare class BasicAuthGuard implements CanActivate {
    private readonly userService;
    constructor(userService: UserService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
