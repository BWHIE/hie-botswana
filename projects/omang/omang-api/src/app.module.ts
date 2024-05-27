import { Module,forwardRef } from '@nestjs/common';
import { ConnectionOptions } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as oracledb from 'oracledb'; // Import oracledb module
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BDRSController } from './controllers/bdrs.controller';
import { BDRSService } from './services/bdrs.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserService } from './services/user.service';
import { DeathRepository, BirthRepository } from './repositories/bdrs-repositories';
import { AutomapperModule } from '@automapper/nestjs';
import { MiddlewareConsumer } from '@nestjs/common';
import { BirthRecord } from './models/birth-record';
import { DeathRecord } from './models/death-record';
import { BirthModule } from './modules/birth.module';
import { DeathModule } from './modules/death.module';
import { OmangModule } from './modules/omang.module';
import { OmangRepository } from './repositories/omang-repository';
import { OmangController } from './controllers/omang.controller';
import { OmangService } from './services/omang.service';
import ormconfig = require('./config/ormconfig'); //path mapping doesn't work here
import { MasterPatientIndexModule } from './modules/mpi.module';
import { ImmigrationService } from './services/immigration.service';
import { PatientController } from './controllers/patient.controller';
import { ImmigrationModule } from './modules/immigration.module';
import { PatientService } from './services/patient.service';
import { IpWhitelistGuard } from './models/middlewares';
import { BasicAuthGuard } from './models/authentification';
import { UserModule } from './modules/user.module';
import * as cookieParser from 'cookie-parser';
import { json, text } from 'express';

@Module({
  imports: [

    UserModule,
    BirthModule,
    DeathModule,
    OmangModule,
    MasterPatientIndexModule,
    ImmigrationModule,
    ],

  controllers: [AppController, BDRSController,OmangController,PatientController],
  providers: [AppService, BDRSService,OmangService, ImmigrationService,PatientService,IpWhitelistGuard,BasicAuthGuard],
})
export class AppModule {

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(json({ limit: '10Mb', type: ['application/fhir+json', 'application/json+fhir', 'application/json'] }))
      .forRoutes('*')
      .apply(text())
      .forRoutes('*')
      .apply(cookieParser())
      .forRoutes('*');
  }
  
}
