import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OmangRepository } from './repositories/omang-repository';
import { createConnection } from 'typeorm';
import { omangDataSourceOptions } from '../../config/ormconfig';

@Module({
  imports: [
    TypeOrmModule.forFeature([], 'omangConnection'),
    forwardRef(() => OmangModule),
  ],

  providers: [
    {
      provide: 'omangConnectionDataSource',
      useFactory: async () => await createConnection(omangDataSourceOptions),
    },

    OmangRepository,
  ],
  exports: [OmangRepository], // Export Omang Repository to be used in other modules
})
export class OmangModule {}
