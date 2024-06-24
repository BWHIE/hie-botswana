import { Global, Module } from '@nestjs/common';
import { UserService } from './services/user.service';

@Global()
@Module({
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
