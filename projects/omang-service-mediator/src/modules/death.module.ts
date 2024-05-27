import { Module,forwardRef, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeathRepository } from '../repositories/bdrs-repositories';
import {createConnection} from 'typeorm';
import { deathDataSourceOptions } from '../config/ormconfig';
@Module({
  imports: [
  TypeOrmModule.forFeature([],'deathConnection'), 
  forwardRef(() => DeathModule)],
  
  providers: [
    {
      provide: 'deathConnectionDataSource', 
      useFactory: async () => await createConnection(deathDataSourceOptions),

    },
    DeathRepository, 
  ], 
  exports: [DeathRepository],
})
export class DeathModule {}
