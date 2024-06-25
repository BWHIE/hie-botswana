import { Module } from '@nestjs/common';
import { CommonController } from './common/common.controller';
import { CommonService } from './common/common.service';

@Module({
  controllers: [CommonController],
  providers: [CommonService]
})
export class CommonModule {}
