"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BDRSService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BDRSService = void 0;
const common_1 = require("@nestjs/common");
const bdrs_repositories_1 = require("../data/bdrs-repositories");
const fhirmapper_1 = require("../utils/fhirmapper");
const fhir_responses_1 = require("../models/fhir-responses");
const mpi_1 = require("./mpi");
let BDRSService = BDRSService_1 = class BDRSService {
    constructor(deaths, births, mpi) {
        this.deaths = deaths;
        this.births = births;
        this.mpi = mpi;
        this.logger = new common_1.Logger(BDRSService_1.name);
    }
    async isOnline() {
        const deathsStatus = await this.deaths.checkStatus();
        const birthsStatus = await this.births.checkStatus();
        return deathsStatus && birthsStatus;
    }
    async findBirthByFullName(firstName, lastName, pager) {
        const names = firstName.split(' ');
        if (names.length > 1) {
            return this.births.getByNameWithMiddleName(names[0].trim(), names[1].trim(), lastName, pager);
        }
        else {
            return this.births.getByName(firstName, lastName, pager);
        }
    }
    async findBirthByFullNameFHIR(firstName, lastName, pager) {
        try {
            const results = await this.findBirthByFullName(firstName, lastName, pager);
            if (results.length > 0) {
                const bundle = (0, fhirmapper_1.mapBirthRecordsToSearchBundle)(results);
                return bundle;
            }
            else
                return fhir_responses_1.FhirAPIResponses.RecordInitialized;
        }
        catch (Exception) {
            this.logger.error("Error retrieving records in FHIR format \n " + Exception.message);
        }
    }
    findBirthByLastName(LastName, pager) {
        return this.births.getByLastName(LastName, pager);
    }
    findBirthsByDate(startDate, endDate, pager) {
        return this.births.findBirthsByDate(startDate, endDate, pager);
    }
    async findDeathByFullName(firstName, lastName, pager) {
        const names = firstName.split(' ');
        if (names.length > 1) {
            return this.deaths.getByNameWithMiddleName(names[0].trim(), names[1].trim(), lastName, pager);
        }
        else {
            return this.deaths.getByName(firstName, lastName, pager);
        }
    }
    async findDeathByLastName(lastName, pager) {
        return this.deaths.getByLastName(lastName, pager);
    }
    async findDeathsByDate(startDate, endDate, pager) {
        return this.deaths.findDeathsByDate(startDate, endDate, pager);
    }
    async getDeathByID(ids, pager) {
        const results = await this.deaths.getMany(ids, pager);
        if (results.length > 0) {
            return (0, fhirmapper_1.mapDeathRecordsToSearchBundle)(results);
        }
        else
            return fhir_responses_1.FhirAPIResponses.RecordInitialized;
    }
    async getBirthByID(ids, pager) {
        const results = await this.births.getMany(ids, pager);
        if (results.length > 0) {
            return (0, fhirmapper_1.mapBirthDeathRecordToSearchBundle)(results);
        }
        else
            return fhir_responses_1.FhirAPIResponses.RecordInitialized;
    }
    async processCrBundle(ids, pager, search_bundle) {
        if (search_bundle != null && search_bundle.total > 0) {
            return search_bundle;
        }
        else {
            const results = await this.births.getMany(ids, pager);
            if (results != null) {
                for (const result of results) {
                    const pat = (0, fhirmapper_1.mapBirthDeathRecordToFhirPatient)(result);
                    this.mpi.createPatient(pat);
                }
                return (0, fhirmapper_1.mapBirthDeathRecordToSearchBundle)(results);
            }
            else
                return null;
        }
    }
};
exports.BDRSService = BDRSService;
exports.BDRSService = BDRSService = BDRSService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(bdrs_repositories_1.DeathRepository)),
    __param(1, (0, common_1.Inject)(bdrs_repositories_1.BirthRepository)),
    __param(2, (0, common_1.Inject)(mpi_1.MasterPatientIndex)),
    __metadata("design:paramtypes", [bdrs_repositories_1.DeathRepository,
        bdrs_repositories_1.BirthRepository,
        mpi_1.MasterPatientIndex])
], BDRSService);
//# sourceMappingURL=bdrs.service.js.map