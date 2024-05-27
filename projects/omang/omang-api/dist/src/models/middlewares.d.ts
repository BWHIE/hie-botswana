import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class IpWhitelistGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
    private getClientIp;
}
