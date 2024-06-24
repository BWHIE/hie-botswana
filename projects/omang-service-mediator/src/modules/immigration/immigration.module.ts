import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { immigrationDataSourceOptions } from 'src/config/ormconfig';
import { createConnection } from 'typeorm';
import { ImmigrationController } from './controllers/immigration.controller';
import { ImmigrationRepository } from './repositories/immigration-repository';
import { ImmigrationService } from './services/immigration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([], 'immigrationConnection'),
  ],
  controllers: [
    ImmigrationController,
  ],
  providers: [
    {
      provide: 'immigrationConnectionDataSource',
      useFactory: async () =>
        await createConnection(immigrationDataSourceOptions),
    },
    ImmigrationRepository,
    ImmigrationService
  ],
  exports: [ImmigrationService],
})
export class ImmigrationModule {}
