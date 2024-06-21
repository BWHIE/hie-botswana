import { MiddlewareConsumer, Module } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { json, text } from 'express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BdrsModule } from './modules/bdrs/bdrs.module';
import { ImmigrationModule } from './modules/immigration/immigration.module';
import { MpiModule } from './modules/mpi/mpi.module';
import { OmangModule } from './modules/omang/omang.module';
import { OpenHimModule } from './modules/openhim/openhim.module';
import { PatientModule } from './modules/patient/patient.module';
import { BasicAuthGuard } from './modules/user/models/authentification';
import { UserModule } from './modules/user/user.module';
import { IpWhitelistGuard } from './utils/middlewares';

@Module({
  imports: [
    OpenHimModule,
    UserModule,
    BdrsModule,
    OmangModule,
    MpiModule,
    ImmigrationModule,
    PatientModule,
  ],
  controllers: [
    AppController,
  ],
  providers: [
    AppService,
    IpWhitelistGuard,
    BasicAuthGuard,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        json({
          limit: '10Mb',
          type: [
            'application/fhir+json',
            'application/json+fhir',
            'application/json',
            'application/json+openhim',
          ],
        }),
      )
      .forRoutes('*')
      .apply(text())
      .forRoutes('*')
      .apply(cookieParser())
      .forRoutes('*');
  }
}
