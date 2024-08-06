import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pager } from 'src/utils/pager';
import { OmangRepository } from '../repositories/omang-repository';
import { fhirR4 } from '@smile-cdr/fhirts';
import { Omang } from '../models/omang';
import { calculateMD5Hash } from 'src/utils/hash';
import { FhirAPIResponses } from 'src/utils/fhir-responses';
import { BaseService } from 'src/services/base.service';
import { MpiService } from '../../mpi/services/mpi.service';
import config from 'src/config';

@Injectable()
export class OmangService extends BaseService {
  protected readonly logger = new Logger(OmangService.name);

  constructor(
    @Inject(OmangRepository)
    private readonly repo: OmangRepository,
    @Inject(MpiService)
    protected readonly mpi: MpiService,
  ) {
    super(mpi);
  }

  async getOmangByID(ID: string[], pager: Pager): Promise<fhirR4.Bundle> {
    const results = await this.repo.getMany(ID, pager);
    if (results.length > 0) {
      const omangBundle: fhirR4.Bundle = this.mapOmangToSearchBundle(results);
      return omangBundle;
    } else {
      return FhirAPIResponses.RecordInitialized;
    }
  }

  async isOnline(): Promise<boolean> {
    return this.repo.checkStatus();
  }

  // Unused Endpoints for searching Omang data
  async findOmangByChangeDate(
    changeStartDate: Date,
    changeEndDate: Date,
    pager: Pager,
  ): Promise<fhirR4.Bundle> {
    const results = await this.repo.getChanged(
      changeStartDate,
      changeEndDate,
      pager,
    );
    if (results.length > 0) {
      return this.mapOmangToSearchBundle(results);
    } else return FhirAPIResponses.RecordInitialized;
  }

  async findOmangByChangeDateNonFHIR(
    changeStartDate: Date,
    changeEndDate: Date,
    pager: Pager,
  ): Promise<Omang[]> {
    return this.repo.getChanged(changeStartDate, changeEndDate, pager);
  }

  async findOmangByDeceasedDate(
    deceasedStartDate: Date,
    deceasedEndDate: Date,
    pager: Pager,
  ): Promise<fhirR4.Bundle> {
    const results = await this.repo.getDeceased(
      deceasedStartDate,
      deceasedEndDate,
      pager,
    );
    if (results.length > 0) {
      return this.mapOmangToSearchBundle(results);
    } else return FhirAPIResponses.RecordInitialized;
  }

  async findOmangByDeceasedDateNonFHIR(
    deceasedStartDate: Date,
    deceasedEndDate: Date,
    pager: Pager,
  ): Promise<Omang[]> {
    return this.repo.getDeceased(deceasedStartDate, deceasedEndDate, pager);
  }

  async findOmangByFullName(
    firstName: string,
    lastName: string,
    pager: Pager,
  ): Promise<fhirR4.Bundle> {
    const results = await this.repo.getByName(firstName, lastName, pager);
    if (results.length > 0) {
      return this.mapOmangToSearchBundle(results);
    } else return FhirAPIResponses.RecordInitialized;
  }

  async findOmangByDemographicData(
    firstName: string,
    lastName: string,
    gender: string,
    birthDate: string,
    pager: Pager,
  ): Promise<fhirR4.Bundle> {
    const results = await this.repo.getByDemographicData(
      firstName,
      lastName,
      gender,
      birthDate,
      pager,
    );
    if (results.length > 0) {
      return this.mapOmangToSearchBundle(results);
    } else return FhirAPIResponses.RecordInitialized;
  }

  async findOmangByFullNameNonFHIR(
    firstName: string,
    lastName: string,
    pager: Pager,
  ): Promise<Omang[]> {
    return this.repo.getByName(firstName, lastName, pager);
  }

  async findOmangByLastName(
    lastName: string,
    pager: Pager,
  ): Promise<fhirR4.Bundle> {
    const results = await this.repo.getByLastName(lastName, pager);
    if (results.length > 0) {
      return this.mapOmangToSearchBundle(results);
    } else return FhirAPIResponses.RecordInitialized;
  }

  async findOmangByLastNameNonFHIR(
    lastName: string,
    pager: Pager,
  ): Promise<Omang[]> {
    return this.repo.getByLastName(lastName, pager);
  }

  async getOmangByIDNonFHIR(ID: string[], pager: Pager): Promise<Omang[]> {
    return this.repo.getMany(ID, pager);
  }

  private mapOmangToFhirPatient(omang: Omang): fhirR4.Patient | null {
    // let fhirPatient: fhirR4.Patient | null = null;

    const fhirPatient = new fhirR4.Patient();
    if (omang.IdNo) {
      // Resource Type
      fhirPatient.resourceType = 'Patient';
      //Id
      // fhirPatient.id = omang.IdNo;

      // Identifier
      const pat_identifier = new fhirR4.Identifier();
      pat_identifier.system = config.get('ClientRegistry:OmangSystem');
      pat_identifier.value = omang.IdNo;

      // Hash Unique Internal ID
      const hashedId = calculateMD5Hash(omang.IdNo);
      const internal_identifier = new fhirR4.Identifier();
      internal_identifier.system =
        'http://omang.bw.org/ext/identifier/internalid';
      internal_identifier.value = hashedId;
      fhirPatient.identifier = [pat_identifier, internal_identifier];

      //Active
      fhirPatient.active = true;
      // Name
      const pat_name = new fhirR4.HumanName();
      pat_name.family = omang.Surname;
      pat_name.given = omang.FirstName.split(' ');
      fhirPatient.name = [pat_name];

      // Gender
      switch (omang.Sex) {
        case 'F':
          fhirPatient.gender = fhirR4.Patient.GenderEnum.Female;
          break;
        case 'M':
          fhirPatient.gender = fhirR4.Patient.GenderEnum.Male;
          break;
      }

      // Birthdate
      fhirPatient.birthDate = omang.BirthDate?.toISOString().slice(0, 10);

      // Deceased
      if (omang.DeceasedDate) {
        fhirPatient.deceasedDateTime = omang.DeceasedDate.toISOString().slice(
          0,
          10,
        );
      }

      // Address
      const address = new fhirR4.Address();
      address.district = omang.DistrictName;
      address.postalCode = omang.DistrictCode;

      fhirPatient.address = [address];

      // Marital Status

      const system_url = 'http://hl7.org/fhir/R4/valueset-marital-status.html';
      fhirPatient.maritalStatus = new fhirR4.CodeableConcept();
      fhirPatient.maritalStatus.coding = [];
      const theCoding = new fhirR4.Coding();
      theCoding.system = system_url;
      switch (omang.MaritalStatusCode) {
        case 'MAR':
          theCoding.code = 'M';
          break;
        case 'SGL':
          theCoding.code = 'S';
          break;
        case 'WDW':
          theCoding.code = 'W';
          break;
        case 'DIV':
          theCoding.code;
          break;
        case 'SEP':
          theCoding.code;
          break;
        case 'WHD':
          theCoding.code = 'UNK';
          break;
      }

      fhirPatient.maritalStatus.coding.push(theCoding);
    }

    fhirPatient.meta = {
      tag: [
        {
          system: 'http://openclientregistry.org/fhir/source',
          code: 'omang',
        },
      ],
    };

    return fhirPatient;
  }

  private mapOmangToSearchBundle(omangRecords: Omang[]): fhirR4.Bundle {
    const searchBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;

    for (const omang of omangRecords) {
      const patient: fhirR4.Patient = this.mapOmangToFhirPatient(omang);

      const entry = new fhirR4.BundleEntry();
      entry.fullUrl =
        config.get('ClientRegistry:OmangSystem') +
        patient.constructor.name +
        patient.identifier[0].value;

      entry.resource = patient;
      searchBundle.entry.push(entry);
      ++searchBundle.total;
    }

    return searchBundle;
  }
}
