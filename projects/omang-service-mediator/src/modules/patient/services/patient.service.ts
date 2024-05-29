import { Inject, Injectable, Logger } from '@nestjs/common';
import { fhirR4 } from '@smile-cdr/fhirts';
import { config } from 'src/config';
import { Pager } from 'src/utils/pager';
import { BDRSService } from '../../bdrs/services/bdrs.service';
import { ImmigrationService } from '../../immigration/services/immigration.service';
import { MasterPatientIndex } from '../../mpi/services/mpi';
import { OmangService } from '../../omang/services/omang.service';

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

  // async getPatientByFHIRName(name: fhirR4.HumanName): Promise<fhirR4.Bundle> {
  //   throw new Error('Method not implemented');
  // }

  async getPatientByFullName(
    firstName: string,
    lastName: string,
    system: string,
    pager: Pager,
  ): Promise<fhirR4.Bundle> {
    this.logger.log('Getting patient by Full Name');

    if (system === config.get('ClientRegistry:OmangSystem')) {
      return this.omang.findOmangByFullName(firstName, lastName, pager);
    } else if (system === config.get('ClientRegistry:ImmigrationSystem')) {
      return this.immigration.getByFullName(firstName, lastName, pager);
    } else if (system === config.get('ClientRegistry:BdrsSystem')) {
      return this.bdrs.findBirthByFullNameFHIR(firstName, lastName, pager);
    } else throw new Error('System Not Supported');
  }

  async getPatientByID(
    identifier: string,
    system: string,
  ): Promise<fhirR4.Bundle> {
    this.logger.log('Getting patient by ID');

    if (system === config.get('ClientRegistry:OmangSystem')) {
      return this.omang.getOmangByID([identifier], new Pager(1, 1));
    } else if (system === config.get('ClientRegistry:ImmigrationSystem')) {
      return this.immigration.getPatientByPassportNumber(
        identifier,
        new Pager(1, 1),
      );
    } else if (system === config.get('ClientRegistry:BdrsSystem')) {
      return this.bdrs.getBirthByID([identifier], new Pager(1, 1));
    } else throw new Error('System Not Supported');
  }

  async isOnline(): Promise<boolean> {
    return this.immigration.isOnline();
  }
}
