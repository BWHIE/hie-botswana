import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MasterPatientIndex } from './services/mpi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
  ],
  providers: [MasterPatientIndex],
  exports: [MasterPatientIndex],
})
export class MasterPatientIndexModule {}