import {Inject, Injectable,Logger } from "@nestjs/common";
import { Pager } from "../models/omang";
import { BirthRecord } from "../models/birth-record";
import { DeathRecord } from "../models/death-record";
import { BirthDeathRecord } from "../models/birthdeath-record";
import { DeathRepository, BirthRepository } from "../repositories/bdrs-repositories";
import { fhirR4 } from "@smile-cdr/fhirts";
import { mapBirthDeathRecordToFhirPatient, mapBirthDeathRecordToSearchBundle, mapDeathRecordsToSearchBundle,mapBirthRecordsToSearchBundle } from "../utils/fhirmapper";
import { FhirAPIResponses } from "../models/fhir-responses";
import { MasterPatientIndex } from "./mpi";

@Injectable()
export class BDRSService {

  private readonly logger : Logger = new Logger(BDRSService.name)
  constructor(
    @Inject(DeathRepository)
    private readonly deaths: DeathRepository,
    @Inject(BirthRepository)
    private readonly births: BirthRepository,
   
    
    @Inject(MasterPatientIndex)
    private readonly mpi: MasterPatientIndex,

  ) {}

  async isOnline(): Promise<boolean> {

    const deathsStatus = await this.deaths.checkStatus();
    const birthsStatus = await this.births.checkStatus()
    return deathsStatus && birthsStatus;
  }

  async findBirthByFullName(firstName: string, lastName: string, pager: Pager): Promise<BirthRecord[]> {
    const names = firstName.split(' ');

    if (names.length > 1) {
      return this.births.getByNameWithMiddleName(names[0].trim(), names[1].trim(), lastName, pager);
    } else {
      return this.births.getByName(firstName, lastName, pager);
    }
  }

  async findBirthByFullNameFHIR(firstName: string, lastName: string, pager: Pager): Promise<fhirR4.Bundle> {
    try {
      const results =  await this.findBirthByFullName(firstName,lastName,pager);
      if (results.length > 0) {
        const bundle: fhirR4.Bundle =  mapBirthRecordsToSearchBundle(results);
        return bundle;

      } else return FhirAPIResponses.RecordInitialized;
    } catch (Exception){
      this.logger.error("Error retrieving records in FHIR format \n " + Exception.message);
    }

  }
  
  findBirthByLastName(LastName: string, pager: Pager): Promise<BirthRecord[]> {

    return this.births.getByLastName(LastName, pager);
  }

  findBirthsByDate(startDate: Date, endDate: Date, pager: Pager): Promise<BirthRecord[]> {
    return this.births.findBirthsByDate(startDate, endDate, pager);
  }


  async findDeathByFullName(firstName: string, lastName: string, pager: Pager): Promise<DeathRecord[]> {
    const names = firstName.split(' ');

    if (names.length > 1) {
      return this.deaths.getByNameWithMiddleName(names[0].trim(), names[1].trim(), lastName, pager);
    } else {
      return this.deaths.getByName(firstName, lastName, pager);
    }
  }
  
  async findDeathByLastName(lastName: string, pager: Pager): Promise<DeathRecord[]> {
    return this.deaths.getByLastName(lastName, pager);
  }

  async findDeathsByDate(startDate: Date, endDate: Date, pager: Pager): Promise<DeathRecord[]> {
    return this.deaths.findDeathsByDate(startDate, endDate, pager);
  }

  //@TODO uncomment these methods once Fhir mapper and Master Patient Index are implemented 

//   getBirthDeathByID(ids: string[], pager: Pager ): Promise<fhirR4.Bundle>{}

  async getDeathByID(ids: string[], pager: Pager ): Promise<fhirR4.Bundle>{
    const results: DeathRecord[] = await this.deaths.getMany(ids,pager);
    if (results.length > 0)
      {
        return mapDeathRecordsToSearchBundle(results)
      }
      else return FhirAPIResponses.RecordInitialized;
    
  }

  async getBirthByID(ids: string[], pager: Pager ): Promise<fhirR4.Bundle>{
    const results: BirthDeathRecord[] = await this.births.getMany(ids,pager);
    if (results.length > 0){
      return mapBirthDeathRecordToSearchBundle(results);

    } else return FhirAPIResponses.RecordInitialized;
   
  }


  private async processCrBundle(ids: string[],pager: Pager ,search_bundle: fhirR4.Bundle): Promise<fhirR4.Bundle> {
    if (search_bundle != null && search_bundle.total > 0)
      {
          // If exists, return search bundle
          return search_bundle;
      }
      else
      {
          // Otherwise, query the Omang DB
          const results: BirthDeathRecord[] = await this.births.getMany(ids, pager);

          if (results != null)
          {
              // Save to CR
              // TODO: Consider async??
              // TODO: Exception handling
              for (const result of results)
              {
                  const pat = mapBirthDeathRecordToFhirPatient(result);
                  this.mpi.createPatient(pat);
              }

              // Return Search Bundle
              return mapBirthDeathRecordToSearchBundle(results);
          }

          else
              return null;
      }
  }
}
