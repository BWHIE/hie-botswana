import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { BasicAuthGuard } from './modules/user/models/authentification';

@Controller()
@UseGuards(BasicAuthGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  healthCheck(): string {
    return this.appService.healthCheck();
  }
}
