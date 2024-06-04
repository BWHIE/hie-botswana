import { Module } from '@nestjs/common';
import { OpenHimService } from './openhim.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [OpenHimService],
  exports: [OpenHimService],
})
export class OpenHimModule {}
