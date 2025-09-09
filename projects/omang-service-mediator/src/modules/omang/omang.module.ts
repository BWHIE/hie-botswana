import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OmangRepository } from './repositories/omang-repository';
import { omangDataSourceOptions } from 'src/config/ormconfig';
import { OmangController } from './controllers/omang.controller';
import { OmangService } from './services/omang.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(omangDataSourceOptions),
    TypeOrmModule.forFeature([], 'omangConnection'),
    forwardRef(() => OmangModule),
  ],
  controllers: [OmangController],
  providers: [OmangRepository, OmangService],
  exports: [OmangService],
})
export class OmangModule {}
