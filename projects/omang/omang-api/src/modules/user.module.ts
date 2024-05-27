import { Module,forwardRef, Global } from '@nestjs/common';
import { UserService } from '../services/user.service';

@Module({
  imports: [forwardRef(() => UserModule)],

  
  providers: [UserService],
  exports: [UserService], // Export BirthRepository to be used in other modules
})
export class UserModule {  }
