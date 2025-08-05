import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { immigrationDataSourceOptions } from 'src/config/ormconfig';
import { ImmigrationController } from './controllers/immigration.controller';
import { ImmigrationRepository } from './repositories/immigration-repository';
import { ImmigrationService } from './services/immigration.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(immigrationDataSourceOptions),
    TypeOrmModule.forFeature([], 'immigrationConnection'),
  ],
  controllers: [ImmigrationController],
  providers: [ImmigrationRepository, ImmigrationService],
  exports: [ImmigrationService],
})
export class ImmigrationModule {}
