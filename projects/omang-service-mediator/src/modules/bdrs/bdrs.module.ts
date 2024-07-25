import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  birthDataSourceOptions,
  deathDataSourceOptions,
} from 'src/config/ormconfig';
import { createConnection } from 'typeorm';
import { BDRSController } from './controllers/bdrs.controller';
import { BirthRepository } from './repositories/birth.repository';
import { DeathRepository } from './repositories/death.repository';
import { BDRSService } from './services/bdrs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([], 'birthConnection'), // Import entities related to BirthService
    TypeOrmModule.forFeature([], 'deathConnection'),
  ],
  controllers: [BDRSController],
  providers: [
    {
      provide: 'birthConnectionDataSource',
      useFactory: async () => await createConnection(birthDataSourceOptions),
    },
    {
      provide: 'deathConnectionDataSource',
      useFactory: async () => await createConnection(deathDataSourceOptions),
    },
    BirthRepository,
    DeathRepository,
    BDRSService,
  ],
  exports: [BDRSService],
})
export class BdrsModule {}
