import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { BotswanaModule } from './botswana/botswana.module';
import { OpenHimModule } from './openhim/openhim.module';

@Module({
  imports: [CommonModule, BotswanaModule, OpenHimModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
