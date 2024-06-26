import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BdrsModule } from '../bdrs/bdrs.module';
import { ImmigrationModule } from '../immigration/immigration.module';
import { OmangModule } from '../omang/omang.module';
import { PatientController } from './controllers/patient.controller';
import { PatientService } from './services/patient.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    BdrsModule,
    OmangModule,
    ImmigrationModule
  ],
  controllers: [
    PatientController
  ],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
