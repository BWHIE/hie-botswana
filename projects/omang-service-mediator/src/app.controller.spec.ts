import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { IpWhitelistGuard } from './utils/middlewares';
import { BasicAuthGuard } from './modules/user/models/authentification';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
      controllers: [AppController],
      providers: [AppService, IpWhitelistGuard, BasicAuthGuard],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Omang Service!"', () => {
      expect(appController.healthCheck()).toBe('Omang Service!');
    });
  });
});
