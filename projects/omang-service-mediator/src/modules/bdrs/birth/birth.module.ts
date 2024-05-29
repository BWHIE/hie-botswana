// birth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createConnection } from 'typeorm';
import { BirthRepository } from '../repositories/birth.repository';
import { birthDataSourceOptions } from '../../../config/ormconfig';

@Module({
  imports: [
    TypeOrmModule.forFeature([], 'birthConnection'), // Import entities related to BirthService
    forwardRef(() => BirthModule),
  ],
  providers: [
    {
      provide: 'birthConnectionDataSource',
      useFactory: async () => await createConnection(birthDataSourceOptions),
    },
    BirthRepository,
  ],
  exports: [BirthRepository],
})
export class BirthModule {}
