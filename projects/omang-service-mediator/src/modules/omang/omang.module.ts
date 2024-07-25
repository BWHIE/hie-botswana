import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OmangRepository } from './repositories/omang-repository';
import { createConnection } from 'typeorm';
import { omangDataSourceOptions } from 'src/config/ormconfig';
import { OmangController } from './controllers/omang.controller';
import { OmangService } from './services/omang.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([], 'omangConnection'),
    forwardRef(() => OmangModule),
  ],
  controllers: [OmangController],
  providers: [
    {
      provide: 'omangConnectionDataSource',
      useFactory: async () => await createConnection(omangDataSourceOptions),
    },
    OmangRepository,
    OmangService,
  ],
  exports: [OmangService],
})
export class OmangModule {}
