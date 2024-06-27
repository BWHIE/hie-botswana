import { Module } from '@nestjs/common';
import { IpsController } from './controllers/ips.controller';
import { HttpModule } from '@nestjs/axios';
import { FhirService } from './services/fhir.service';
import { IpsService } from './services/ips.service';
import { FhirController } from './controllers/fhir.controller';

@Module({
  imports: [HttpModule],
  controllers: [IpsController, FhirController],
  providers: [FhirService, IpsService],
})
export class CommonModule {}
