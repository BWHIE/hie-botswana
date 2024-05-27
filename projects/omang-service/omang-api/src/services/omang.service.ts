import {Inject, Injectable,Logger } from "@nestjs/common";
import { Pager } from "../models/omang";
import { OmangRepository } from "../repositories/omang-repository";
import { fhirR4 } from "@smile-cdr/fhirts";
import { Omang } from "../models/omang";
import { mapOmangToFhirPatient, mapOmangToSearchBundle } from "../utils/fhirmapper";
import { FhirAPIResponses } from "../models/fhir-responses";
import { BaseService } from "./base.service";
import { MasterPatientIndex } from "./mpi";
import {ClientRegistry} from '../app-settings.json';

@Injectable()
export class OmangService extends BaseService {
  protected readonly logger = new Logger(OmangService.name);

  constructor(
    @Inject(OmangRepository)
    private readonly repo: OmangRepository,
    @Inject(MasterPatientIndex)
    protected readonly mpi: MasterPatientIndex,
  ) {super(mpi)}

  async getOmangByID(ID: string[], pager: Pager): Promise<fhirR4.Bundle> {
    const results = await this.repo.getMany(ID, pager);
    if (results.length > 0){
      const omangBundle: fhirR4.Bundle =  mapOmangToSearchBundle(results);
      // await this.updateClientRegistryAsync(results, ID, ClientRegistry.OmangSystem);
      return omangBundle;
      } 
      else return FhirAPIResponses.RecordInitialized;
  }

  async isOnline(): Promise<Boolean> {
    return this.repo.checkStatus();
  }

  // Unused Endpoints for searching Omang data
  async findOmangByChangeDate(
    changeStartDate: Date,
    changeEndDate: Date,
    pager: Pager,
  ): Promise<fhirR4.Bundle> {
    const results = await this.repo.getChanged(changeStartDate, changeEndDate, pager);
    if (results.length > 0){
      return mapOmangToSearchBundle(results);
      } 
      else return FhirAPIResponses.RecordInitialized;
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
    const results = await this.repo.getDeceased(deceasedStartDate, deceasedEndDate, pager);
    if (results.length > 0){
      return mapOmangToSearchBundle(results);
      } 
      else return FhirAPIResponses.RecordInitialized;
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
    if (results.length > 0){
      return mapOmangToSearchBundle(results);
      } 
      else return FhirAPIResponses.RecordInitialized;
    }

  async findOmangByFullNameNonFHIR(
    firstName: string,
    lastName: string,
    pager: Pager,
  ): Promise<Omang[]> {
    return this.repo.getByName(firstName, lastName, pager);
  }

  async findOmangByLastName(lastName: string, pager: Pager): Promise<fhirR4.Bundle> {
    const results = await this.repo.getByLastName(lastName, pager);
    if (results.length > 0){
      return mapOmangToSearchBundle(results);
      } 
      else return FhirAPIResponses.RecordInitialized;
  }
  

  async findOmangByLastNameNonFHIR(lastName: string, pager: Pager): Promise<Omang[]> {
    return this.repo.getByLastName(lastName, pager);
  }

  async getOmangByIDNonFHIR(ID: string[], pager: Pager): Promise<Omang[]> {
    return this.repo.getMany(ID, pager);
  }

  private async updateClientRegistryAsync<T>(results: Omang[], identifiers: string[], configKey: string): Promise<void> {
    const searchParamValue = `${configKey}|${identifiers[0]}`
    const searchBundle = await this.retryGetSearchBundleAsync(searchParamValue);
    console.log(searchBundle)

    if (this.needsUpdateOrIsEmpty(searchBundle)) {
      for (const result of results) {
        try {
          const patient:fhirR4.Patient = mapOmangToFhirPatient(result);
          console.log('our patient is as follows ' + patient);
          await this.mpi.createPatient(patient);
        } catch (error) {
          this.logger.error(`Error creating patient: ${error.message}`);
        }
      }
    }
  }
}