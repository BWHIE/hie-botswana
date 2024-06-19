import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pager } from 'src/utils/pager';
import { BirthRecord } from '../models/birth-record';
import { DeathRecord } from '../models/death-record';
import { BirthDeathRecord } from '../models/birthdeath-record';
import { DeathRepository } from '../repositories/death.repository';
import { BirthRepository } from '../repositories/birth.repository';
import { fhirR4 } from '@smile-cdr/fhirts';
import { calculateMD5Hash } from 'src/utils/hash';
import { FhirAPIResponses } from 'src/utils/fhir-responses';
import { MasterPatientIndex } from '../../mpi/services/mpi';
import { config } from 'src/config';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class BDRSService extends BaseService {
  protected readonly logger: Logger = new Logger(BDRSService.name);
  constructor(
    @Inject(DeathRepository)
    private readonly deaths: DeathRepository,
    @Inject(BirthRepository)
    private readonly births: BirthRepository,

    @Inject(MasterPatientIndex)
    protected readonly mpi: MasterPatientIndex,
  ) {
    super(mpi);
  }

  async isOnline(): Promise<boolean> {
    const deathsStatus = await this.deaths.checkStatus();
    const birthsStatus = await this.births.checkStatus();
    return deathsStatus && birthsStatus;
  }

  async getDeathByID(ids: string[], pager: Pager): Promise<fhirR4.Bundle> {
    const results: DeathRecord[] = await this.deaths.getMany(ids, pager);
    if (results.length > 0) {
      return this.mapDeathRecordsToSearchBundle(results);
    } else return FhirAPIResponses.RecordInitialized;
  }

  async getBirthByID(ids: string[], pager: Pager): Promise<fhirR4.Bundle> {
    const results: BirthDeathRecord[] = await this.births.getMany(ids, pager);
    if (results.length > 0) {
      const bundle: fhirR4.Bundle =
        this.mapBirthDeathRecordToSearchBundle(results);
      return bundle;
    } else return FhirAPIResponses.RecordInitialized;
  }

  async findBirthByFullName(
    firstName: string,
    lastName: string,
    pager: Pager,
  ): Promise<BirthRecord[]> {
    const names = firstName.split(' ');

    if (names.length > 1) {
      return this.births.getByNameWithMiddleName(
        names[0].trim(),
        names[1].trim(),
        lastName,
        pager,
      );
    } else {
      return this.births.getByName(firstName, lastName, pager);
    }
  }

  async findBirthByDemographicData(
    firstName: string,
    lastName: string,
    gender: string,
    birthDate: string,
    pager: Pager,
  ): Promise<BirthRecord[]> {
    return this.births.getByDemographicData(firstName, lastName, gender, birthDate, pager);
  }

  async findBirthByFullNameFHIR(
    firstName: string,
    lastName: string,
    pager: Pager,
  ): Promise<fhirR4.Bundle> {
    try {
      const results = await this.findBirthByFullName(
        firstName,
        lastName,
        pager,
      );
      if (results.length > 0) {
        const bundle: fhirR4.Bundle =
          this.mapBirthRecordsToSearchBundle(results);
        return bundle;
      } else return FhirAPIResponses.RecordInitialized;
    } catch (error) {
      this.logger.error(
        'Error retrieving records in FHIR format \n ' + error.message,
      );
    }
  }

  async findBirthByDemographicDataFHIR(
    firstName: string,
    lastName: string,
    gender: string,
    birthDate: string,
    pager: Pager,
  ): Promise<fhirR4.Bundle> {
    try {
      const results = await this.findBirthByDemographicData(
        firstName,
        lastName,
        gender,
        birthDate,
        pager,
      );
      if (results.length > 0) {
        const bundle: fhirR4.Bundle =
          this.mapBirthRecordsToSearchBundle(results);
        return bundle;
      } else return FhirAPIResponses.RecordInitialized;
    } catch (error) {
      this.logger.error(
        'Error retrieving records in FHIR format \n ' + error.message,
      );
    }
  }

  async findBirthByLastName(
    LastName: string,
    pager: Pager,
  ): Promise<BirthRecord[]> {
    return this.births.getByLastName(LastName, pager);
  }

  async findBirthsByDate(
    startDate: Date,
    endDate: Date,
    pager: Pager,
  ): Promise<BirthRecord[]> {
    return this.births.findBirthsByDate(startDate, endDate, pager);
  }

  async findDeathByFullName(
    firstName: string,
    lastName: string,
    pager: Pager,
  ): Promise<DeathRecord[]> {
    const names = firstName.split(' ');

    if (names.length > 1) {
      return this.deaths.getByNameWithMiddleName(
        names[0].trim(),
        names[1].trim(),
        lastName,
        pager,
      );
    } else {
      return this.deaths.getByName(firstName, lastName, pager);
    }
  }

  async findDeathByLastName(
    lastName: string,
    pager: Pager,
  ): Promise<DeathRecord[]> {
    return this.deaths.getByLastName(lastName, pager);
  }

  async findDeathsByDate(
    startDate: Date,
    endDate: Date,
    pager: Pager,
  ): Promise<DeathRecord[]> {
    return this.deaths.findDeathsByDate(startDate, endDate, pager);
  }

  private mapBirthDeathRecordToSearchBundle(
    birthDeathRecord: BirthDeathRecord[],
  ): fhirR4.Bundle {
    const searchBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;

    for (const bdr of birthDeathRecord) {
      const patient: fhirR4.Patient =
        this.mapBirthDeathRecordToFhirPatient(bdr);

      const entry = new fhirR4.BundleEntry();
      entry.fullUrl =
        config.get('ClientRegistry:BdrsSystem') +
        patient.constructor.name +
        patient.id;

      entry.resource = patient;
      searchBundle.entry.push(entry);
      ++searchBundle.total;
    }

    return searchBundle;
  }

  private mapBirthRecordsToSearchBundle(records: BirthRecord[]): fhirR4.Bundle {
    const searchBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;

    for (const record of records) {
      const patient: fhirR4.Patient = this.mapBirthecordToFhirPatient(record);

      const entry = new fhirR4.BundleEntry();
      entry.fullUrl =
        config.get('ClientRegistry:BdrsSystem') +
        patient.constructor.name +
        patient.id;

      entry.resource = patient;
      searchBundle.entry.push(entry);
      ++searchBundle.total;
    }

    return searchBundle;
  }

  private mapDeathRecordsToSearchBundle(records: DeathRecord[]): fhirR4.Bundle {
    const searchBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;

    for (const record of records) {
      const patient: fhirR4.Patient = this.mapDeathRecordToFhirPatient(record);

      const entry = new fhirR4.BundleEntry();
      entry.fullUrl =
        config.get('ClientRegistry:BdrsSystem') +
        patient.constructor.name +
        patient.id;

      entry.resource = patient;
      searchBundle.entry.push(entry);
      ++searchBundle.total;
    }

    return searchBundle;
  }

  private mapBirthDeathRecordToFhirPatient(
    br: BirthDeathRecord,
  ): fhirR4.Patient | null {
    let fhirPatient: fhirR4.Patient | null = null;

    if (br.ID_NUMBER) {
      fhirPatient = new fhirR4.Patient();

      //Resource Type
      fhirPatient.resourceType = 'Patient';

      // ID
      fhirPatient.id = br.ID_NUMBER;

      // Identifier
      const patIdentifier = new fhirR4.Identifier();
      patIdentifier.system = config.get('ClientRegistry:BdrsSystem');
      patIdentifier.value = br.ID_NUMBER;
      const hashedId = calculateMD5Hash(br.ID_NUMBER);

      const internalIdentifier = new fhirR4.Identifier();
      internalIdentifier.system =
        'http://omang.bw.org/ext/identifier/internalid';
      internalIdentifier.value = hashedId;

      fhirPatient.identifier = [patIdentifier, internalIdentifier];

      //Active
      fhirPatient.active = true;

      // Name
      const patName = new fhirR4.HumanName();
      patName.family = br.SURNAME;
      const given = [br.FORENAME];
      if (br.OTHER_NAME) given.push(br.OTHER_NAME);
      patName.given = given;

      fhirPatient.name = [patName];

      //Gender
      switch (br.SEX) {
        case 'F':
          fhirPatient.gender = fhirR4.Patient.GenderEnum.Female;
          break;
        case 'M':
          fhirPatient.gender = fhirR4.Patient.GenderEnum.Male;
          break;
      }

      //BirthDate
      fhirPatient.birthDate = br.DATE_OF_BIRTH.toISOString().split('T')[0]; // Format: "yyyy-MM-dd"

      // Deceased
      let deceased: fhirR4.ModelBoolean | fhirR4.DateTime = false;
      if (br.DEATH_CERTIFICATE) {
        if (br.DATE_OF_DEATH) {
          deceased = br.DATE_OF_DEATH.toISOString().slice(0, 10);
        } else {
          deceased = true;
        }
      }
      if (typeof deceased === 'string') {
        fhirPatient.deceasedDateTime = deceased;
      } else if (typeof deceased == 'boolean') {
        fhirPatient.deceasedBoolean = deceased;
      }

      // Address
      const address = new fhirR4.Address();
      address.district = br.DISTRICT_OF_BIRTH_NAME;
      address.postalCode = br.DISTRICT_OF_BIRTH;
      address.city = br.TOWN_VILL;
      if (br.WARD_STREET) address.line = [br.WARD_STREET];
      fhirPatient.address = [address];
    }

    return fhirPatient;
  }

  private mapDeathRecordToFhirPatient(
    deathRecord: DeathRecord,
  ): fhirR4.Patient {
    const fhirPatient: fhirR4.Patient = new fhirR4.Patient();

    if (!deathRecord.ID_NUMBER) {
      return null;
    }

    // Resource Type
    fhirPatient.resourceType = 'Patient';
    //Id
    fhirPatient.id = deathRecord.ID_NUMBER;

    //Identifier

    const patIdentifier: fhirR4.Identifier = new fhirR4.Identifier();
    patIdentifier.system = config.get('ClientRegistry:BdrsSystem');
    patIdentifier.value = deathRecord.ID_NUMBER;
    // Hash Unique Internal ID
    const hashedId: string = calculateMD5Hash(deathRecord.ID_NUMBER);
    const internalIdentifier: fhirR4.Identifier = new fhirR4.Identifier();
    internalIdentifier.system = 'http://omang.bw.org/ext/identifier/internalid';
    internalIdentifier.value = hashedId;
    fhirPatient.identifier = [patIdentifier, internalIdentifier];

    // Active
    fhirPatient.active = true;

    // Name

    const patName: fhirR4.HumanName = new fhirR4.HumanName();

    if (deathRecord.SURNAME) {
      patName.family = deathRecord.SURNAME;
    }
    if (deathRecord.FORENAME) {
      patName.given = [deathRecord.FORENAME];
    }
    if (deathRecord.OTHER_NAME) {
      patName.given = patName.given
        ? [...patName.given, deathRecord.OTHER_NAME]
        : [deathRecord.OTHER_NAME];
    }

    if (patName) {
      fhirPatient.name = [patName];
    }

    // Gender

    if (deathRecord.SEX) {
      switch (deathRecord.SEX.toUpperCase()) {
        case 'F':
        case 'FEMALE':
          fhirPatient.gender = fhirR4.Patient.GenderEnum.Female;
          break;
        case 'M':
        case 'MALE':
          fhirPatient.gender = fhirR4.Patient.GenderEnum.Male;
          break;
      }
    }

    // Deceased

    if (deathRecord.DATE_OF_DEATH) {
      fhirPatient.deceasedDateTime =
        deathRecord.DATE_OF_DEATH.toISOString().slice(0, 10);
    }

    // Address

    const address: fhirR4.Address = new fhirR4.Address();

    if (deathRecord.WARD_STREET) {
      address.line = [deathRecord.WARD_STREET];
    }

    if (deathRecord.TOWN_VILL) {
      address.city = deathRecord.TOWN_VILL;
    }

    if (deathRecord.DISTRICT_OF_DEATH_NAME) {
      address.district = deathRecord.DISTRICT_OF_DEATH_NAME;
    }

    if (deathRecord.DISTRICT_OF_DEATH) {
      address.postalCode = deathRecord.DISTRICT_OF_DEATH;
    }
    if (deathRecord.NATIONALITY) {
      address.country = deathRecord.NATIONALITY;
    }

    fhirPatient.address = [address];

    // Extensions

    // fhirPatient.extension = []

    return fhirPatient;
  }

  private mapBirthecordToFhirPatient(birthRecord: BirthRecord): fhirR4.Patient {
    const fhirPatient: fhirR4.Patient = new fhirR4.Patient();

    if (!birthRecord.ID_NUMBER) {
      return null;
    }

    // Resource Type
    fhirPatient.resourceType = 'Patient';

    //Id
    fhirPatient.id = birthRecord.ID_NUMBER;

    //Identifier

    const patIdentifier: fhirR4.Identifier = new fhirR4.Identifier();
    patIdentifier.system = config.get('ClientRegistry:BdrsSystem');
    patIdentifier.value = birthRecord.ID_NUMBER;
    // Hash Unique Internal ID
    const hashedId: string = calculateMD5Hash(birthRecord.ID_NUMBER);
    const internalIdentifier: fhirR4.Identifier = new fhirR4.Identifier();
    internalIdentifier.system = 'http://omang.bw.org/ext/identifier/internalid';
    internalIdentifier.value = hashedId;
    fhirPatient.identifier = [patIdentifier, internalIdentifier];

    // Active
    fhirPatient.active = true;

    // Name

    const patName: fhirR4.HumanName = new fhirR4.HumanName();

    if (birthRecord.SURNAME) {
      patName.family = birthRecord.SURNAME;
    }
    if (birthRecord.FORENAME) {
      patName.given = [birthRecord.FORENAME];
    }
    if (birthRecord.OTHER_NAME) {
      patName.given = patName.given
        ? [...patName.given, birthRecord.OTHER_NAME]
        : [birthRecord.OTHER_NAME];
    }

    if (patName) {
      fhirPatient.name = [patName];
    }

    // Gender

    if (birthRecord.SEX) {
      switch (birthRecord.SEX.toUpperCase()) {
        case 'F':
        case 'FEMALE':
          fhirPatient.gender = fhirR4.Patient.GenderEnum.Female;
          break;
        case 'M':
        case 'MALE':
          fhirPatient.gender = fhirR4.Patient.GenderEnum.Male;
          break;
      }
    }

    // Address

    const address: fhirR4.Address = new fhirR4.Address();

    if (birthRecord.DISTRICT_OF_BIRTH_NAME) {
      address.district = birthRecord.DISTRICT_OF_BIRTH_NAME;
    }

    if (birthRecord.TOWN_VILL) {
      address.city = birthRecord.TOWN_VILL;
    }

    if (birthRecord.WARD_STREET) {
      address.line = [birthRecord.WARD_STREET];
    }

    fhirPatient.address = [address];

    // @TODO : Put it as an extension or add it to the address (to look deeper into)????

    // Extensions

    // fhirPatient.extension = []

    return fhirPatient;
  }

  private async processCrBundle(
    ids: string[],
    pager: Pager,
    search_bundle: fhirR4.Bundle,
    clientId: string,
  ): Promise<fhirR4.Bundle> {
    if (search_bundle != null && search_bundle.total > 0) {
      // If exists, return search bundle
      return search_bundle;
    } else {
      // Otherwise, query the Omang DB
      const results: BirthDeathRecord[] = await this.births.getMany(ids, pager);

      if (results != null) {
        // Save to CR
        // TODO: Consider async??
        // TODO: Exception handling
        for (const result of results) {
          const pat = this.mapBirthDeathRecordToFhirPatient(result);
          this.mpi.createPatient(pat,clientId);
        }

        // Return Search Bundle
        return this.mapBirthDeathRecordToSearchBundle(results);
      } else return null;
    }
  }
}
