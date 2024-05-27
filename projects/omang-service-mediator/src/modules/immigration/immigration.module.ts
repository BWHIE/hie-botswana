import { Module,forwardRef, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {createConnection} from 'typeorm';
import { immigrationDataSourceOptions } from '../../config/ormconfig';
import { ImmigrationRepository } from './repositories/immigration-repository';

@Module({
  imports: [
  TypeOrmModule.forFeature([],'immigrationConnection'), 
  forwardRef(() => ImmigrationModule)],
  
  providers: [
    {
      provide: 'immigrationConnectionDataSource', 
      useFactory: async () => await createConnection(immigrationDataSourceOptions),

    },
    ImmigrationRepository, 
  ], 
  exports: [ImmigrationRepository],
})
export class ImmigrationModule {}
