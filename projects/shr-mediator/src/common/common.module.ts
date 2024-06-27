import { Module } from '@nestjs/common';
import { CommonController } from './controllers/common.controller';
import { CommonService } from './services/common.service';

@Module({
  controllers: [CommonController],
  providers: [CommonService]
})
export class CommonModule {}
