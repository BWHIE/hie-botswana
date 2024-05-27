import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { BasicAuthGuard } from './models/authentification';
import { IpWhitelistGuard } from './models/middlewares';

@Controller()
@UseGuards(BasicAuthGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
