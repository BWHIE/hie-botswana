import { Injectable, Logger, Inject } from '@nestjs/common';
import { fhirR4 } from '@smile-cdr/fhirts';
import { ImmigrationRepository } from '../repositories/immigration-repository';
import { FhirAPIResponses } from 'src/utils/fhir-responses';
import { ImmigrationRecord } from '../models/immigration-record';
import { Pager } from 'src/utils/pager';
import { mapImmigrationRecordToSearchBundle } from 'src/utils/fhirmapper';
import { BaseService } from '../../../services/base.service';
import { MasterPatientIndex } from '../../mpi/services/mpi';

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
      const bundle: fhirR4.Bundle = mapImmigrationRecordToSearchBundle(results);
      // await this.updateClientRegistryAsync(results, [ppn], ClientRegistry.ImmigrationSystem);
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
          mapImmigrationRecordToSearchBundle(results);
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

  // private async updateClientRegistryAsync<T>(results: ImmigrationRecord[], identifiers: string[], configKey: string): Promise<void> {
  //   const searchParamValue = `${configKey}|${identifiers[0]}`
  //   const searchBundle = await this.retryGetSearchBundleAsync(searchParamValue);

  //   if (this.needsUpdateOrIsEmpty(searchBundle)) {
  //     for (const result of results) {
  //       try {
  //         const patient:fhirR4.Patient = mapImmigrationRecordToFhirPatient(result)
  //         await this.mpi.createPatient(patient);
  //       } catch (error) {
  //         this.logger.error(`Error creating patient: ${error.message}`);
  //       }
  //     }
  //   }
  // }
}
