import { Inject, Injectable, Logger } from '@nestjs/common';
import { fhirR4 } from '@smile-cdr/fhirts';
import { config } from 'src/config';
import { Pager } from 'src/utils/pager';
import { BDRSService } from '../../bdrs/services/bdrs.service';
import { ImmigrationService } from '../../immigration/services/immigration.service';
import { MasterPatientIndex } from '../../mpi/services/mpi';
import { OmangService } from '../../omang/services/omang.service';
import { BaseService } from 'src/services/base.service';
import { FhirAPIResponses } from 'src/utils/fhir-responses';

@Injectable()
export class PatientService extends BaseService {
  protected readonly logger = new Logger(PatientService.name);

  constructor(
    @Inject(MasterPatientIndex)
    protected readonly mpi: MasterPatientIndex,
    @Inject(OmangService)
    private readonly omang: OmangService,
    @Inject(BDRSService)
    private readonly bdrs: BDRSService,
    @Inject(ImmigrationService)
    private readonly immigration: ImmigrationService,
  ) {super(mpi)}

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

  async getPatientByDemographicData(
    firstName: string,
    lastName: string,
    gender: string,
    birthDate: string,
    pager: Pager,
  ): Promise<fhirR4.Bundle> {
    this.logger.log('Getting patient by demographic data');

    const searchBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;

    searchBundle.entry.push(await this.omang.findOmangByDemographicData(firstName, lastName, gender, birthDate, pager));
    searchBundle.entry.push(await this.immigration.getByFullName(firstName, lastName, pager));
    searchBundle.entry.push(await this.bdrs.findBirthByFullNameFHIR(firstName, lastName, pager));

    return searchBundle;
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
        [identifier],
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
