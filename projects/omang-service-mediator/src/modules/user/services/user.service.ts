import { Injectable, Logger } from '@nestjs/common';
import config from 'src/config';
import { User } from '../models/authentification'; // Assuming you have defined the User entity

@Injectable()
export class UserService {
  logger: Logger = new Logger(UserService.name);
  constructor() {}

  async authenticate(username: string, password: string): Promise<User | null> {
    try {
      this.logger.log(
        `Received an authentication request for user: ${username}`,
      );

      const id: number = config.get('Auth:Basic:Id');
      const configUsername: string = config.get('Auth:Basic:Username');
      const configPassword: string = config.get('Auth:Basic:Password');

      // Check if the password is correct and return the user object if so, null otherwise
      return username === configUsername && password === configPassword
        ? new User(id, username, password)
        : null;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async getAllUsers(): Promise<User[]> {
    throw new Error('Method not implemented');
  }
}
