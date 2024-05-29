import { Injectable, Logger, Inject } from '@nestjs/common';
import { fhirR4 } from '@smile-cdr/fhirts';
import { ImmigrationRepository } from '../repositories/immigration-repository';
import { FhirAPIResponses } from 'src/utils/fhir-responses';
import { ImmigrationRecord } from '../models/immigration-record';
import { Pager } from 'src/utils/pager';
import { calculateMD5Hash } from 'src/utils/hash';
import { BaseService } from 'src/services/base.service';
import { MasterPatientIndex } from '../../mpi/services/mpi';
import config from 'src/config';

@Injectable()
export class ImmigrationService extends BaseService {
  protected readonly logger = new Logger(ImmigrationService.name);

  constructor(
    @Inject(ImmigrationRepository)
    private readonly repo: ImmigrationRepository,
    @Inject(MasterPatientIndex)
    protected readonly mpi: MasterPatientIndex,
  ) {
    super(mpi);
  }

  async getPatientByPassportNumber(
    ppn: string,
    pager: Pager,
  ): Promise<fhirR4.Bundle> {
    const results: ImmigrationRecord[] = await this.repo.getMany([ppn], pager);
    if (results.length > 0) {
      const bundle: fhirR4.Bundle =
        this.mapImmigrationRecordToSearchBundle(results);
      await this.updateClientRegistryAsync(
        results,
        [ppn],
        config.get('ClientRegistry:ImmigrationSystem'),
      );
      return bundle;
    } else return FhirAPIResponses.RecordInitialized;
  }

  async findByBirthDate(
    startDate: Date,
    endDate: Date,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    return this.repo.findByBirthDate(startDate, endDate, pager);
  }

  async findByCountry(
    country: string,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    return this.repo.findByCountry(country, pager);
  }

  async findByEntryDate(
    startDate: Date,
    endDate: Date,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    return this.repo.findByEntryDate(startDate, endDate, pager);
  }

  async findByPassportExpiryDate(
    startDate: Date,
    endDate: Date,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    return this.repo.findByPassportExpiryDate(startDate, endDate, pager);
  }

  async findBySex(sex: string, pager: Pager): Promise<ImmigrationRecord[]> {
    return this.repo.findBySex(sex, pager);
  }

  async getByFullNameNonFHIR(
    firstName: string,
    lastName: string,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    const names = firstName.split(' ');

    if (names.length > 1) {
      return this.repo.getByNameWithMiddleName(
        names[0].trim(),
        names[1].trim(),
        lastName,
        pager,
      );
    } else {
      return this.repo.getByName(firstName, lastName, pager);
    }
  }

  async getByFullName(
    firstName: string,
    lastName: string,
    pager: Pager,
  ): Promise<fhirR4.Bundle> {
    try {
      const results = await this.getByFullNameNonFHIR(
        firstName,
        lastName,
        pager,
      );
      if (results.length > 0) {
        const bundle: fhirR4.Bundle =
          this.mapImmigrationRecordToSearchBundle(results);
        return bundle;
      } else return FhirAPIResponses.RecordInitialized;
    } catch (Exception) {
      this.logger.error(
        'Error retrieving records in FHIR format \n ' + Exception.message,
      );
    }
  }

  async getByLastName(
    lastName: string,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    return this.repo.getByLastName(lastName, pager);
  }

  async getByPassportNo(
    passportNo: string[],
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    return this.repo.getMany(passportNo, pager);
  }

  async isOnline(): Promise<boolean> {
    return this.repo.checkStatus();
  }

  private async updateClientRegistryAsync(
    results: ImmigrationRecord[],
    identifiers: string[],
    configKey: string,
  ): Promise<void> {
    const searchParamValue = `${configKey}|${identifiers[0]}`;
    const searchBundle = await this.retryGetSearchBundleAsync(searchParamValue);

    if (this.needsUpdateOrIsEmpty(searchBundle)) {
      for (const result of results) {
        try {
          const patient: fhirR4.Patient =
            this.mapImmigrationRecordToFhirPatient(result);
          await this.mpi.createPatient(patient);
        } catch (error) {
          this.logger.error(`Error creating patient: ${error.message}`);
        }
      }
    }
  }

  private mapImmigrationRecordToSearchBundle(
    immigrationRecords: ImmigrationRecord[],
  ): fhirR4.Bundle {
    const searchBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
    for (const ir of immigrationRecords) {
      const patient: fhirR4.Patient =
        this.mapImmigrationRecordToFhirPatient(ir);

      const entry = new fhirR4.BundleEntry();
      entry.fullUrl =
        config.get('ClientRegistry:ImmigrationSystem') +
        patient.constructor.name +
        patient.id;

      entry.resource = patient;
      searchBundle.entry.push(entry);
      ++searchBundle.total;
    }

    return searchBundle;
  }

  private mapImmigrationRecordToFhirPatient(
    immigrationRecord: ImmigrationRecord,
  ): fhirR4.Patient {
    if (!immigrationRecord.PASSPORT_NO) {
      return null;
    }

    const fhirPatient: fhirR4.Patient = new fhirR4.Patient();

    // Resource Type
    fhirPatient.resourceType = 'Patient';

    // Id
    fhirPatient.id = immigrationRecord.PASSPORT_NO;

    // Identifier
    const patIdentifier: fhirR4.Identifier = new fhirR4.Identifier();
    patIdentifier.system = config.get('ClientRegistry:ImmigrationSystem');
    patIdentifier.value = immigrationRecord.PASSPORT_NO;

    // Hash Unique Internal ID
    const hashedId: string = calculateMD5Hash(immigrationRecord.PASSPORT_NO);
    const internalIdentifier: fhirR4.Identifier = new fhirR4.Identifier();
    internalIdentifier.system = 'http://omang.bw.org/ext/identifier/internalid';
    internalIdentifier.value = hashedId;

    fhirPatient.identifier = [patIdentifier, internalIdentifier];

    // Active
    fhirPatient.active = true;

    // Name
    const patName: fhirR4.HumanName = new fhirR4.HumanName();
    patName.family = immigrationRecord.SURNAME;
    patName.given = [immigrationRecord.FIRST_NAME];
    if (immigrationRecord.MIDDLE_NAME) {
      patName.given.push(immigrationRecord.MIDDLE_NAME);
    }
    fhirPatient.name = [patName];

    // Gender
    switch (immigrationRecord.GENDER.toUpperCase()) {
      case 'F':
      case 'FEMALE':
        fhirPatient.gender = fhirR4.Patient.GenderEnum.Female;
        break;
      case 'M':
      case 'MALE':
        fhirPatient.gender = fhirR4.Patient.GenderEnum.Male;
        break;
    }

    // Birthdate
    fhirPatient.birthDate = new Date(immigrationRecord.BIRTH_DATE)
      .toISOString()
      .slice(0, 10);

    // Address
    const address: fhirR4.Address = new fhirR4.Address();
    address.country = immigrationRecord.BIRTH_COUNTRY_NAME;
    address.postalCode = immigrationRecord.BIRTH_COUNTRY_CODE;

    fhirPatient.address = [address];

    return fhirPatient;
  }
}
