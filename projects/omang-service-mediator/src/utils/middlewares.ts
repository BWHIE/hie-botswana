import { Injectable, CanActivate, ExecutionContext, UnauthorizedException,ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../modules/user/services/user.service';
import {SafeList} from '../app-settings.json';


@Injectable()
export class IpWhitelistGuard implements CanActivate {

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const clientIp = this.getClientIp(request);
    
    const safelist = SafeList.IP.split(';');
    if (!safelist.includes(clientIp)) {
      throw new ForbiddenException('Forbidden request from remote IP address: ' + clientIp);
    }

    return true;
  }

  private getClientIp(request: Request): string {
    const xForwardedFor = request.headers['x-forwarded-for'] as string;
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }

    return request.connection.remoteAddress;
  }
}
