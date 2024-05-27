import {ClientRegistry} from '../app-settings.json';
import { fhirR4 } from '@smile-cdr/fhirts';

import { ImmigrationRecord } from '../modules/immigration/models/immigration-record';
import { BirthDeathRecord } from '../modules/bdrs/models/birthdeath-record';
import { DeathRecord } from '../modules/bdrs/models/death-record';
import { Omang, OmangFHIRPatient } from '../modules/omang/models/omang';

import { v4 as uuidv4 } from 'uuid';
import { FhirAPIResponses } from './fhir-responses';
import { BirthRecord } from 'src/modules/bdrs/models/birth-record';

function calculateMD5Hash(input: string): string {
    const md5 = require('crypto').createHash('md5');
    md5.update(input);
    return md5.digest('hex');
    }
    

export function mapImmigrationRecordToFhirPatient(immigrationRecord: ImmigrationRecord): fhirR4.Patient {
    if (!immigrationRecord.PASSPORT_NO) {
        return null;
    }

    const fhirPatient: fhirR4.Patient = new fhirR4.Patient();

    // Resource Type
    fhirPatient.resourceType = 'Patient';

    // Id
    fhirPatient.id = immigrationRecord.PASSPORT_NO;

    // Identifier 
    const patIdentifier: fhirR4.Identifier = new  fhirR4.Identifier();
    patIdentifier.system =  ClientRegistry.ImmigrationSystem;
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
        fhirPatient.gender =  fhirR4.Patient.GenderEnum.Female;
        break;
        case 'M':
        case 'MALE':
        fhirPatient.gender =  fhirR4.Patient.GenderEnum.Male;
        break;
    }

    // Birthdate
    fhirPatient.birthDate = new Date(immigrationRecord.BIRTH_DATE).toISOString().slice(0, 10);

    // Address
    const address: fhirR4.Address = new fhirR4.Address();
    address.country = immigrationRecord.BIRTH_COUNTRY_NAME;
    address.postalCode = immigrationRecord.BIRTH_COUNTRY_CODE;

    fhirPatient.address = [address];

    return fhirPatient;
    }

export function  mapBirthDeathRecordToFhirPatient(br: BirthDeathRecord): fhirR4.Patient | null {
        let fhirPatient: fhirR4.Patient | null = null;
    
        if (br.ID_NUMBER) {
            fhirPatient = new fhirR4.Patient();

            //Resource Type 
            fhirPatient.resourceType = 'Patient';


            // ID
            fhirPatient.id = br.ID_NUMBER;

            // Identifier
            const patIdentifier = new fhirR4.Identifier();
            patIdentifier.system = ClientRegistry.BdrsSystem;
            patIdentifier.value = br.ID_NUMBER;
            const hashedId = calculateMD5Hash(br.ID_NUMBER);
    
            const internalIdentifier = new fhirR4.Identifier();
            internalIdentifier.system = "http://omang.bw.org/ext/identifier/internalid";
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
                case "F":
                    fhirPatient.gender = fhirR4.Patient.GenderEnum.Female;
                    break;
                case "M":
                    fhirPatient.gender = fhirR4.Patient.GenderEnum.Male;
                    break;
            }

            //BirthDate
            fhirPatient.birthDate = br.DATE_OF_BIRTH.toISOString().split('T')[0]; // Format: "yyyy-MM-dd"

            // Deceased
            let deceased: fhirR4.ModelBoolean | fhirR4.DateTime= false;
            if (br.DEATH_CERTIFICATE) {
                if (br.DATE_OF_DEATH) {
                    
                    deceased = br.DATE_OF_DEATH.toISOString().slice(0,10);
                } else {
                    deceased = true;
                }
            }
            if (typeof deceased === 'string') {
                fhirPatient.deceasedDateTime = deceased;
    
            } else if (typeof deceased=='boolean'){
                fhirPatient.deceasedBoolean = deceased;
            }
    
            // Address
            const address = new fhirR4.Address();
            address.district = br.DISTRICT_OF_BIRTH_NAME;
            address.postalCode = br.DISTRICT_OF_BIRTH;
            address.city = br.TOWN_VILL;
            if (br.WARD_STREET)
                address.line = [br.WARD_STREET];
            fhirPatient.address = [address];
            
        }
    
        return fhirPatient;
    }

export function mapOmangToFhirPatient(omang: Omang): fhirR4.Patient | null {
        // let fhirPatient: fhirR4.Patient | null = null;
    
        const fhirPatient = new fhirR4.Patient();
        if (omang.IdNo) {

            // Resource Type
            fhirPatient.resourceType = 'Patient';
            //Id
            fhirPatient.id = omang.IdNo;
    
            // Identifier
            const pat_identifier = new fhirR4.Identifier();
            pat_identifier.system = ClientRegistry.OmangSystem;
            pat_identifier.value = omang.IdNo;
    
            // Hash Unique Internal ID
            const hashedId = calculateMD5Hash(omang.IdNo);
            const internal_identifier = new fhirR4.Identifier();
            internal_identifier.system = "http://omang.bw.org/ext/identifier/internalid";
            internal_identifier.value = hashedId;
            fhirPatient.identifier = [pat_identifier, internal_identifier];

    
            //Active 
            fhirPatient.active = true;
            // Name
            const pat_name = new fhirR4.HumanName();
            pat_name.family = omang.Surname;
            pat_name.given = omang.FirstName.split(" ");
            fhirPatient.name = [pat_name];
                     
            // Gender
            switch (omang.Sex) {

                case "F":
                    fhirPatient.gender = fhirR4.Patient.GenderEnum.Female;
                    break;
                case "M":
                    fhirPatient.gender = fhirR4.Patient.GenderEnum.Male;
                    break;
            }

            // Birthdate
            fhirPatient.birthDate = omang.BirthDate?.toISOString().slice(0, 10);

            // Deceased
            if (omang.DeceasedDate) {
                fhirPatient.deceasedDateTime = omang.DeceasedDate.toISOString().slice(0, 10);
            } 

            // Address
            const address = new fhirR4.Address();
            address.district = omang.DistrictName;
            address.postalCode = omang.DistrictCode;

            fhirPatient.address = [address];

            // Marital Status

            const system_url = "http://hl7.org/fhir/R4/valueset-marital-status.html";
            fhirPatient.maritalStatus = new fhirR4.CodeableConcept();
            fhirPatient.maritalStatus.coding = [];
            const theCoding = new fhirR4.Coding();
            theCoding.system = system_url
            switch (omang.MaritalStatusCode) {
                case "MAR":                   
                    theCoding.code ="M";
                    break;
                case "SGL":
                    theCoding.code ="S";
                    break;
                case "WDW":
                    theCoding.code ="W";
                    break;
                case "DIV":
                    theCoding.code;
                    break;
                case "SEP":
                    theCoding.code;
                    break;
                case "WHD":
                    theCoding.code ="UNK";
                    break;
            }

            fhirPatient.maritalStatus.coding.push(theCoding);
        }




        return fhirPatient;
    }

    
    
export function mapOmangToSearchBundle(omangRecords: Omang[]): fhirR4.Bundle {
    const searchBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;

    for (const omang of omangRecords) {
        const patient: fhirR4.Patient = mapOmangToFhirPatient(omang);

        const entry = new fhirR4.BundleEntry();
        entry.fullUrl = ClientRegistry.OmangSystem + patient.constructor.name + patient.id;

        entry.resource = patient;
        searchBundle.entry.push(entry);
        ++ searchBundle.total;
    }

    return searchBundle;
    }
    
    

export function mapImmigrationRecordToSearchBundle(immigrationRecords: ImmigrationRecord[]): fhirR4.Bundle {

    const searchBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
    for (const ir of immigrationRecords) {
        const patient: fhirR4.Patient = mapImmigrationRecordToFhirPatient(ir);

        const entry = new fhirR4.BundleEntry();
        entry.fullUrl = ClientRegistry.ImmigrationSystem + patient.constructor.name + patient.id;

        entry.resource = patient;
        searchBundle.entry.push(entry);
        ++ searchBundle.total;
    }

    return searchBundle;
    }

    

export function mapBirthDeathRecordToSearchBundle(birthDeathRecord: BirthDeathRecord[]): fhirR4.Bundle {

    const searchBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;

    for (const bdr of birthDeathRecord) {
        const patient: fhirR4.Patient = mapBirthDeathRecordToFhirPatient(bdr);

        const entry = new fhirR4.BundleEntry();
        entry.fullUrl = ClientRegistry.BdrsSystem + patient.constructor.name + patient.id;

        entry.resource = patient;
        searchBundle.entry.push(entry);
        ++ searchBundle.total;
    }

    return searchBundle;
    }


export function prepareFhirPatient(omang: Omang): OmangFHIRPatient | null {
    let result: OmangFHIRPatient | null = null;

    if (omang.IdNo) {
        result = new OmangFHIRPatient();

        switch (omang.Sex) {
            case "F":
                omang.Sex = "female";
                break;
            case "M":
                omang.Sex = "male";
                break;
        }

        switch (omang.MaritalStatusCode) {
            case "MAR":
                omang.MaritalStatusCode = "M";
                break;
            case "SGL":
                omang.MaritalStatusCode = "S";
                break;
            case "WDW":
                omang.MaritalStatusCode = "W";
                break;
            case "DIV":
                omang.MaritalStatusCode = "D";
                break;
            case "SEP":
                omang.MaritalStatusCode = "L";
                break;
            case "WHD":
                omang.MaritalStatusCode = "UNK";
                break;
        }

        // Manually map the details here
        result.Id = omang.IdNo;
        if (result.Identifier[0]) {
            result.Identifier[0].Value = omang.IdNo;
        }
        if (result.Name[0]) {
            result.Name[0].Family = omang.Surname;
            result.Name[0].Given = omang.FirstName.split(" ");
        }
        result.Gender = omang.Sex;
        result.BirthDate = omang.BirthDate;
        result.DeceasedDateTime = omang.DeceasedDate;
        result.Address = [{
            District: omang.DistrictName,
            PostalCode: omang.DistrictCode
        }];
        result.MaritalStatus = {
            Coding: [{
                Code: omang.MaritalStatusCode
            }]
        };
    }

    return result;
}
export function mapDeathRecordToFhirPatient(deathRecord: DeathRecord): fhirR4.Patient {

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
    patIdentifier.system = ClientRegistry.BdrsSystem;
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
    };
    if (deathRecord.FORENAME) {
        patName.given = [deathRecord.FORENAME];
    };
    if (deathRecord.OTHER_NAME) {
        patName.given = patName.given ? [...patName.given, deathRecord.OTHER_NAME] : [deathRecord.OTHER_NAME];
    };

    if(patName){
        fhirPatient.name = [patName]; };

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
    };


    // Deceased

    if (deathRecord.DATE_OF_DEATH) {
        fhirPatient.deceasedDateTime = deathRecord.DATE_OF_DEATH.toISOString().slice(0, 10);
    };

    
    // Address    

    const address: fhirR4.Address = new fhirR4.Address();

    if (deathRecord.WARD_STREET) {
        address.line = [deathRecord.WARD_STREET];
    };

    if (deathRecord.TOWN_VILL) {
        address.city = deathRecord.TOWN_VILL;
    };

    if (deathRecord.DISTRICT_OF_DEATH_NAME) {
        address.district = deathRecord.DISTRICT_OF_DEATH_NAME;
    };
  

    if (deathRecord.DISTRICT_OF_DEATH) {
        address.postalCode = deathRecord.DISTRICT_OF_DEATH;
    };
    if (deathRecord.NATIONALITY) {
        address.country = deathRecord.NATIONALITY;
    };

    fhirPatient.address = [address];

    // Extensions

    // fhirPatient.extension = []



    return fhirPatient;
}


export function mapDeathRecordsToSearchBundle(records: DeathRecord[]):fhirR4.Bundle {

    const searchBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;

    for (const record of records) {
        const patient: fhirR4.Patient = mapDeathRecordToFhirPatient(record);

        const entry = new fhirR4.BundleEntry();
        entry.fullUrl = ClientRegistry.BdrsSystem + patient.constructor.name + patient.id;

        entry.resource = patient;
        searchBundle.entry.push(entry);
        ++ searchBundle.total;

    }

    return searchBundle;
    }

export function mapBirthecordToFhirPatient(birthRecord: BirthRecord): fhirR4.Patient {

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
    patIdentifier.system = ClientRegistry.BdrsSystem;
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
    };
    if (birthRecord.FORENAME) {
        patName.given = [birthRecord.FORENAME];
    };
    if (birthRecord.OTHER_NAME) {
        patName.given = patName.given ? [...patName.given, birthRecord.OTHER_NAME] : [birthRecord.OTHER_NAME];
    };

    if(patName){
        fhirPatient.name = [patName]; };

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
    };

    
    // Address    

    const address: fhirR4.Address = new fhirR4.Address();


    if (birthRecord.DISTRICT_OF_BIRTH_NAME) {
        address.district = birthRecord.DISTRICT_OF_BIRTH_NAME;
    };

    if (birthRecord.TOWN_VILL) {
        address.city = birthRecord.TOWN_VILL;
    };


    if (birthRecord.WARD_STREET) {
        address.line = [birthRecord.WARD_STREET];
    };


    fhirPatient.address = [address];

    // @TODO : Put it as an extension or add it to the address (to look deeper into)????

    // Extensions

    // fhirPatient.extension = []

    return fhirPatient;
}

export function mapBirthRecordsToSearchBundle(records: BirthRecord[]): fhirR4.Bundle {

    const searchBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;

    for (const record of records) {
        const patient: fhirR4.Patient = mapBirthecordToFhirPatient(record);

        const entry = new fhirR4.BundleEntry();
        entry.fullUrl = ClientRegistry.BdrsSystem + patient.constructor.name + patient.id;

        entry.resource = patient;
        searchBundle.entry.push(entry);
        ++ searchBundle.total;

    }

    return searchBundle;
}