import { Injectable, UnauthorizedException,ExecutionContext,CanActivate} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../services/user.service';

export class User {
    constructor(
        public id: number,
        public username: string,
        public password: string
    ) {}
}

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    const user = await this.userService.authenticate(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Attach user to request for further use
    request.user = user;
    return true;
  }
}
