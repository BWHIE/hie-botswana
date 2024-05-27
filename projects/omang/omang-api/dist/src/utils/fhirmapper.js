"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapBirthRecordsToSearchBundle = exports.mapBirthecordToFhirPatient = exports.mapDeathRecordsToSearchBundle = exports.mapDeathRecordToFhirPatient = exports.prepareFhirPatient = exports.mapBirthDeathRecordToSearchBundle = exports.mapImmigrationRecordToSearchBundle = exports.mapOmangToSearchBundle = exports.mapOmangToFhirPatient = exports.mapBirthDeathRecordToFhirPatient = exports.mapImmigrationRecordToFhirPatient = void 0;
const app_settings_json_1 = require("../app-settings.json");
const fhirts_1 = require("@smile-cdr/fhirts");
const omang_1 = require("../models/omang");
const fhir_responses_1 = require("../models/fhir-responses");
function calculateMD5Hash(input) {
    const md5 = require('crypto').createHash('md5');
    md5.update(input);
    return md5.digest('hex');
}
function mapImmigrationRecordToFhirPatient(immigrationRecord) {
    if (!immigrationRecord.PASSPORT_NO) {
        return null;
    }
    const fhirPatient = new fhirts_1.fhirR4.Patient();
    fhirPatient.resourceType = 'Patient';
    fhirPatient.id = immigrationRecord.PASSPORT_NO;
    const patIdentifier = new fhirts_1.fhirR4.Identifier();
    patIdentifier.system = app_settings_json_1.ClientRegistry.ImmigrationSystem;
    patIdentifier.value = immigrationRecord.PASSPORT_NO;
    const hashedId = calculateMD5Hash(immigrationRecord.PASSPORT_NO);
    const internalIdentifier = new fhirts_1.fhirR4.Identifier();
    internalIdentifier.system = 'http://omang.bw.org/ext/identifier/internalid';
    internalIdentifier.value = hashedId;
    fhirPatient.identifier = [patIdentifier, internalIdentifier];
    fhirPatient.active = true;
    const patName = new fhirts_1.fhirR4.HumanName();
    patName.family = immigrationRecord.SURNAME;
    patName.given = [immigrationRecord.FIRST_NAME];
    if (immigrationRecord.MIDDLE_NAME) {
        patName.given.push(immigrationRecord.MIDDLE_NAME);
    }
    fhirPatient.name = [patName];
    switch (immigrationRecord.GENDER.toUpperCase()) {
        case 'F':
        case 'FEMALE':
            fhirPatient.gender = fhirts_1.fhirR4.Patient.GenderEnum.Female;
            break;
        case 'M':
        case 'MALE':
            fhirPatient.gender = fhirts_1.fhirR4.Patient.GenderEnum.Male;
            break;
    }
    fhirPatient.birthDate = new Date(immigrationRecord.BIRTH_DATE).toISOString().slice(0, 10);
    const address = new fhirts_1.fhirR4.Address();
    address.country = immigrationRecord.BIRTH_COUNTRY_NAME;
    address.postalCode = immigrationRecord.BIRTH_COUNTRY_CODE;
    fhirPatient.address = [address];
    return fhirPatient;
}
exports.mapImmigrationRecordToFhirPatient = mapImmigrationRecordToFhirPatient;
function mapBirthDeathRecordToFhirPatient(br) {
    let fhirPatient = null;
    if (br.ID_NUMBER) {
        fhirPatient = new fhirts_1.fhirR4.Patient();
        fhirPatient.resourceType = 'Patient';
        fhirPatient.id = br.ID_NUMBER;
        const patIdentifier = new fhirts_1.fhirR4.Identifier();
        patIdentifier.system = app_settings_json_1.ClientRegistry.BdrsSystem;
        patIdentifier.value = br.ID_NUMBER;
        const hashedId = calculateMD5Hash(br.ID_NUMBER);
        const internalIdentifier = new fhirts_1.fhirR4.Identifier();
        internalIdentifier.system = "http://omang.bw.org/ext/identifier/internalid";
        internalIdentifier.value = hashedId;
        fhirPatient.identifier = [patIdentifier, internalIdentifier];
        fhirPatient.active = true;
        const patName = new fhirts_1.fhirR4.HumanName();
        patName.family = br.SURNAME;
        const given = [br.FORENAME];
        if (br.OTHER_NAME)
            given.push(br.OTHER_NAME);
        patName.given = given;
        fhirPatient.name = [patName];
        switch (br.SEX) {
            case "F":
                fhirPatient.gender = fhirts_1.fhirR4.Patient.GenderEnum.Female;
                break;
            case "M":
                fhirPatient.gender = fhirts_1.fhirR4.Patient.GenderEnum.Male;
                break;
        }
        fhirPatient.birthDate = br.DATE_OF_BIRTH.toISOString().split('T')[0];
        let deceased = false;
        if (br.DEATH_CERTIFICATE) {
            if (br.DATE_OF_DEATH) {
                deceased = br.DATE_OF_DEATH.toISOString().slice(0, 10);
            }
            else {
                deceased = true;
            }
        }
        if (typeof deceased === 'string') {
            fhirPatient.deceasedDateTime = deceased;
        }
        else if (typeof deceased == 'boolean') {
            fhirPatient.deceasedBoolean = deceased;
        }
        const address = new fhirts_1.fhirR4.Address();
        address.district = br.DISTRICT_OF_BIRTH_NAME;
        address.postalCode = br.DISTRICT_OF_BIRTH;
        address.city = br.TOWN_VILL;
        if (br.WARD_STREET)
            address.line = [br.WARD_STREET];
        fhirPatient.address = [address];
    }
    return fhirPatient;
}
exports.mapBirthDeathRecordToFhirPatient = mapBirthDeathRecordToFhirPatient;
function mapOmangToFhirPatient(omang) {
    const fhirPatient = new fhirts_1.fhirR4.Patient();
    if (omang.IdNo) {
        fhirPatient.resourceType = 'Patient';
        fhirPatient.id = omang.IdNo;
        const pat_identifier = new fhirts_1.fhirR4.Identifier();
        pat_identifier.system = app_settings_json_1.ClientRegistry.OmangSystem;
        pat_identifier.value = omang.IdNo;
        const hashedId = calculateMD5Hash(omang.IdNo);
        const internal_identifier = new fhirts_1.fhirR4.Identifier();
        internal_identifier.system = "http://omang.bw.org/ext/identifier/internalid";
        internal_identifier.value = hashedId;
        fhirPatient.identifier = [pat_identifier, internal_identifier];
        fhirPatient.active = true;
        const pat_name = new fhirts_1.fhirR4.HumanName();
        pat_name.family = omang.Surname;
        pat_name.given = omang.FirstName.split(" ");
        fhirPatient.name = [pat_name];
        switch (omang.Sex) {
            case "F":
                fhirPatient.gender = fhirts_1.fhirR4.Patient.GenderEnum.Female;
                break;
            case "M":
                fhirPatient.gender = fhirts_1.fhirR4.Patient.GenderEnum.Male;
                break;
        }
        fhirPatient.birthDate = omang.BirthDate?.toISOString().slice(0, 10);
        if (omang.DeceasedDate) {
            fhirPatient.deceasedDateTime = omang.DeceasedDate.toISOString().slice(0, 10);
        }
        const address = new fhirts_1.fhirR4.Address();
        address.district = omang.DistrictName;
        address.postalCode = omang.DistrictCode;
        fhirPatient.address = [address];
        const system_url = "http://hl7.org/fhir/R4/valueset-marital-status.html";
        fhirPatient.maritalStatus = new fhirts_1.fhirR4.CodeableConcept();
        fhirPatient.maritalStatus.coding = [];
        const theCoding = new fhirts_1.fhirR4.Coding();
        theCoding.system = system_url;
        switch (omang.MaritalStatusCode) {
            case "MAR":
                theCoding.code = "M";
                break;
            case "SGL":
                theCoding.code = "S";
                break;
            case "WDW":
                theCoding.code = "W";
                break;
            case "DIV":
                theCoding.code;
                break;
            case "SEP":
                theCoding.code;
                break;
            case "WHD":
                theCoding.code = "UNK";
                break;
        }
        fhirPatient.maritalStatus.coding.push(theCoding);
    }
    return fhirPatient;
}
exports.mapOmangToFhirPatient = mapOmangToFhirPatient;
function mapOmangToSearchBundle(omangRecords) {
    const searchBundle = fhir_responses_1.FhirAPIResponses.RecordInitialized;
    for (const omang of omangRecords) {
        const patient = mapOmangToFhirPatient(omang);
        const entry = new fhirts_1.fhirR4.BundleEntry();
        entry.fullUrl = app_settings_json_1.ClientRegistry.OmangSystem + patient.constructor.name + patient.id;
        entry.resource = patient;
        searchBundle.entry.push(entry);
        ++searchBundle.total;
    }
    return searchBundle;
}
exports.mapOmangToSearchBundle = mapOmangToSearchBundle;
function mapImmigrationRecordToSearchBundle(immigrationRecords) {
    const searchBundle = fhir_responses_1.FhirAPIResponses.RecordInitialized;
    for (const ir of immigrationRecords) {
        const patient = mapImmigrationRecordToFhirPatient(ir);
        const entry = new fhirts_1.fhirR4.BundleEntry();
        entry.fullUrl = app_settings_json_1.ClientRegistry.ImmigrationSystem + patient.constructor.name + patient.id;
        entry.resource = patient;
        searchBundle.entry.push(entry);
        ++searchBundle.total;
    }
    return searchBundle;
}
exports.mapImmigrationRecordToSearchBundle = mapImmigrationRecordToSearchBundle;
function mapBirthDeathRecordToSearchBundle(birthDeathRecord) {
    const searchBundle = fhir_responses_1.FhirAPIResponses.RecordInitialized;
    for (const bdr of birthDeathRecord) {
        const patient = mapBirthDeathRecordToFhirPatient(bdr);
        const entry = new fhirts_1.fhirR4.BundleEntry();
        entry.fullUrl = app_settings_json_1.ClientRegistry.BdrsSystem + patient.constructor.name + patient.id;
        entry.resource = patient;
        searchBundle.entry.push(entry);
        ++searchBundle.total;
    }
    return searchBundle;
}
exports.mapBirthDeathRecordToSearchBundle = mapBirthDeathRecordToSearchBundle;
function prepareFhirPatient(omang) {
    let result = null;
    if (omang.IdNo) {
        result = new omang_1.OmangFHIRPatient();
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
exports.prepareFhirPatient = prepareFhirPatient;
function mapDeathRecordToFhirPatient(deathRecord) {
    const fhirPatient = new fhirts_1.fhirR4.Patient();
    if (!deathRecord.ID_NUMBER) {
        return null;
    }
    fhirPatient.resourceType = 'Patient';
    fhirPatient.id = deathRecord.ID_NUMBER;
    const patIdentifier = new fhirts_1.fhirR4.Identifier();
    patIdentifier.system = app_settings_json_1.ClientRegistry.BdrsSystem;
    patIdentifier.value = deathRecord.ID_NUMBER;
    const hashedId = calculateMD5Hash(deathRecord.ID_NUMBER);
    const internalIdentifier = new fhirts_1.fhirR4.Identifier();
    internalIdentifier.system = 'http://omang.bw.org/ext/identifier/internalid';
    internalIdentifier.value = hashedId;
    fhirPatient.identifier = [patIdentifier, internalIdentifier];
    fhirPatient.active = true;
    const patName = new fhirts_1.fhirR4.HumanName();
    if (deathRecord.SURNAME) {
        patName.family = deathRecord.SURNAME;
    }
    ;
    if (deathRecord.FORENAME) {
        patName.given = [deathRecord.FORENAME];
    }
    ;
    if (deathRecord.OTHER_NAME) {
        patName.given = patName.given ? [...patName.given, deathRecord.OTHER_NAME] : [deathRecord.OTHER_NAME];
    }
    ;
    if (patName) {
        fhirPatient.name = [patName];
    }
    ;
    if (deathRecord.SEX) {
        switch (deathRecord.SEX.toUpperCase()) {
            case 'F':
            case 'FEMALE':
                fhirPatient.gender = fhirts_1.fhirR4.Patient.GenderEnum.Female;
                break;
            case 'M':
            case 'MALE':
                fhirPatient.gender = fhirts_1.fhirR4.Patient.GenderEnum.Male;
                break;
        }
    }
    ;
    if (deathRecord.DATE_OF_DEATH) {
        fhirPatient.deceasedDateTime = deathRecord.DATE_OF_DEATH.toISOString().slice(0, 10);
    }
    ;
    const address = new fhirts_1.fhirR4.Address();
    if (deathRecord.WARD_STREET) {
        address.line = [deathRecord.WARD_STREET];
    }
    ;
    if (deathRecord.TOWN_VILL) {
        address.city = deathRecord.TOWN_VILL;
    }
    ;
    if (deathRecord.DISTRICT_OF_DEATH_NAME) {
        address.district = deathRecord.DISTRICT_OF_DEATH_NAME;
    }
    ;
    if (deathRecord.DISTRICT_OF_DEATH) {
        address.postalCode = deathRecord.DISTRICT_OF_DEATH;
    }
    ;
    if (deathRecord.NATIONALITY) {
        address.country = deathRecord.NATIONALITY;
    }
    ;
    fhirPatient.address = [address];
    return fhirPatient;
}
exports.mapDeathRecordToFhirPatient = mapDeathRecordToFhirPatient;
function mapDeathRecordsToSearchBundle(records) {
    const searchBundle = fhir_responses_1.FhirAPIResponses.RecordInitialized;
    for (const record of records) {
        const patient = mapDeathRecordToFhirPatient(record);
        const entry = new fhirts_1.fhirR4.BundleEntry();
        entry.fullUrl = app_settings_json_1.ClientRegistry.BdrsSystem + patient.constructor.name + patient.id;
        entry.resource = patient;
        searchBundle.entry.push(entry);
        ++searchBundle.total;
    }
    return searchBundle;
}
exports.mapDeathRecordsToSearchBundle = mapDeathRecordsToSearchBundle;
function mapBirthecordToFhirPatient(birthRecord) {
    const fhirPatient = new fhirts_1.fhirR4.Patient();
    if (!birthRecord.ID_NUMBER) {
        return null;
    }
    fhirPatient.resourceType = 'Patient';
    fhirPatient.id = birthRecord.ID_NUMBER;
    const patIdentifier = new fhirts_1.fhirR4.Identifier();
    patIdentifier.system = app_settings_json_1.ClientRegistry.BdrsSystem;
    patIdentifier.value = birthRecord.ID_NUMBER;
    const hashedId = calculateMD5Hash(birthRecord.ID_NUMBER);
    const internalIdentifier = new fhirts_1.fhirR4.Identifier();
    internalIdentifier.system = 'http://omang.bw.org/ext/identifier/internalid';
    internalIdentifier.value = hashedId;
    fhirPatient.identifier = [patIdentifier, internalIdentifier];
    fhirPatient.active = true;
    const patName = new fhirts_1.fhirR4.HumanName();
    if (birthRecord.SURNAME) {
        patName.family = birthRecord.SURNAME;
    }
    ;
    if (birthRecord.FORENAME) {
        patName.given = [birthRecord.FORENAME];
    }
    ;
    if (birthRecord.OTHER_NAME) {
        patName.given = patName.given ? [...patName.given, birthRecord.OTHER_NAME] : [birthRecord.OTHER_NAME];
    }
    ;
    if (patName) {
        fhirPatient.name = [patName];
    }
    ;
    if (birthRecord.SEX) {
        switch (birthRecord.SEX.toUpperCase()) {
            case 'F':
            case 'FEMALE':
                fhirPatient.gender = fhirts_1.fhirR4.Patient.GenderEnum.Female;
                break;
            case 'M':
            case 'MALE':
                fhirPatient.gender = fhirts_1.fhirR4.Patient.GenderEnum.Male;
                break;
        }
    }
    ;
    const address = new fhirts_1.fhirR4.Address();
    if (birthRecord.DISTRICT_OF_BIRTH_NAME) {
        address.district = birthRecord.DISTRICT_OF_BIRTH_NAME;
    }
    ;
    if (birthRecord.TOWN_VILL) {
        address.city = birthRecord.TOWN_VILL;
    }
    ;
    if (birthRecord.WARD_STREET) {
        address.line = [birthRecord.WARD_STREET];
    }
    ;
    fhirPatient.address = [address];
    return fhirPatient;
}
exports.mapBirthecordToFhirPatient = mapBirthecordToFhirPatient;
function mapBirthRecordsToSearchBundle(records) {
    const searchBundle = fhir_responses_1.FhirAPIResponses.RecordInitialized;
    for (const record of records) {
        const patient = mapBirthecordToFhirPatient(record);
        const entry = new fhirts_1.fhirR4.BundleEntry();
        entry.fullUrl = app_settings_json_1.ClientRegistry.BdrsSystem + patient.constructor.name + patient.id;
        entry.resource = patient;
        searchBundle.entry.push(entry);
        ++searchBundle.total;
    }
    return searchBundle;
}
exports.mapBirthRecordsToSearchBundle = mapBirthRecordsToSearchBundle;
//# sourceMappingURL=fhirmapper.js.map