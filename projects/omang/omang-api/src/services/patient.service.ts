import { Injectable, Logger, Inject } from '@nestjs/common';
import { ImmigrationService } from './immigration.service';
import { BDRSService } from './bdrs.service';
import { OmangService } from './omang.service';
import { MasterPatientIndex } from './mpi';
import { fhirR4 } from '@smile-cdr/fhirts';
import {ClientRegistry} from '../app-settings.json';
import { Pager } from '../models/omang';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    @Inject(MasterPatientIndex)
    private readonly mpi: MasterPatientIndex,
    @Inject(OmangService)
    private readonly omang: OmangService,
    @Inject(BDRSService)
    private readonly bdrs: BDRSService,
    @Inject(ImmigrationService)
    private readonly immigration: ImmigrationService,

  ) {}

  //@TODO retrieve Patient by applying FHIR compliant search ?
  async getPatientByFHIRName(name: fhirR4.HumanName): Promise<fhirR4.Bundle> {
    throw new Error('Method not implemented');
  }

  async getPatientByFullName(firstName: string, lastName: string, system: string, pager: Pager): Promise<fhirR4.Bundle> {

    this.logger.log('Getting patient by Full Name');

    if (system === ClientRegistry.OmangSystem) {
      return this.omang.findOmangByFullName(firstName, lastName, pager);
    } else if (system === ClientRegistry.ImmigrationSystem) {
      return this.immigration.getByFullName(firstName, lastName, pager);
    } else if (system === ClientRegistry.BdrsSystem) {
      return this.bdrs.findBirthByFullNameFHIR(firstName, lastName, pager);
    } else throw new Error('System Not Supported')
  }

  

  async getPatientByID(identifier: string, system: string): Promise<fhirR4.Bundle> {
    this.logger.log('Getting patient by ID');

    if (system === ClientRegistry.OmangSystem) {
      return this.omang.getOmangByID([identifier], new Pager(1, 1));
    } else if (system === ClientRegistry.ImmigrationSystem) {
      return this.immigration.getPatientByPassportNumber(identifier, new Pager(1, 1));
    } else if (system === ClientRegistry.BdrsSystem) {
      return this.bdrs.getBirthByID([identifier], new Pager(1, 1));
    }  else throw new Error('System Not Supported')
  }
  

  async isOnline(): Promise<boolean> {
    return this.immigration.isOnline();
  }
}