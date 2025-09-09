import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  birthDataSourceOptions,
  deathDataSourceOptions,
} from 'src/config/ormconfig';
import { BDRSController } from './controllers/bdrs.controller';
import { BirthRepository } from './repositories/birth.repository';
import { DeathRepository } from './repositories/death.repository';
import { BDRSService } from './services/bdrs.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(birthDataSourceOptions),
    TypeOrmModule.forRoot(deathDataSourceOptions),
    TypeOrmModule.forFeature([], 'birthConnection'),
    TypeOrmModule.forFeature([], 'deathConnection'),
  ],
  controllers: [BDRSController],
  providers: [BirthRepository, DeathRepository, BDRSService],
  exports: [BDRSService],
})
export class BdrsModule {}
