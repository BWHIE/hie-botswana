import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BDRSController } from './modules/bdrs/controllers/bdrs.controller';
import { BDRSService } from './modules/bdrs/services/bdrs.service';
import { MiddlewareConsumer } from '@nestjs/common';
import { BirthModule } from './modules/bdrs/birth/birth.module';
import { DeathModule } from './modules/bdrs/death/death.module';
import { OmangModule } from './modules/omang/omang.module';
import { OmangController } from './modules/omang/controllers/omang.controller';
import { OmangService } from './modules/omang/services/omang.service';
import { MasterPatientIndexModule } from './modules/mpi/mpi.module';
import { ImmigrationService } from './modules/immigration/services/immigration.service';
import { PatientController } from './modules/patient/controllers/patient.controller';
import { ImmigrationModule } from './modules/immigration/immigration.module';
import { PatientService } from './modules/patient/services/patient.service';
import { IpWhitelistGuard } from './utils/middlewares';
import { BasicAuthGuard } from './modules/user/models/authentification';
import { UserModule } from './modules/user/user.module';
import * as cookieParser from 'cookie-parser';
import { json, text } from 'express';
import { OpenHimModule } from './modules/openhim/openhim.module';

@Module({
  imports: [
    OpenHimModule,
    UserModule,
    BirthModule,
    DeathModule,
    OmangModule,
    MasterPatientIndexModule,
    ImmigrationModule,
  ],
  controllers: [
    AppController,
    BDRSController,
    OmangController,
    PatientController,
  ],
  providers: [
    AppService,
    BDRSService,
    OmangService,
    ImmigrationService,
    PatientService,
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
