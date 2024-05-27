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
var ImmigrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImmigrationService = void 0;
const common_1 = require("@nestjs/common");
const immigration_repository_1 = require("../data/immigration-repository");
const fhir_responses_1 = require("../models/fhir-responses");
const fhirmapper_1 = require("../utils/fhirmapper");
const base_service_1 = require("./base.service");
const mpi_1 = require("./mpi");
let ImmigrationService = ImmigrationService_1 = class ImmigrationService extends base_service_1.BaseService {
    constructor(repo, mpi) {
        super(mpi);
        this.repo = repo;
        this.mpi = mpi;
        this.logger = new common_1.Logger(ImmigrationService_1.name);
    }
    async getPatientByPassportNumber(ppn, pager) {
        const results = await this.repo.getMany([ppn], pager);
        if (results.length > 0) {
            const bundle = (0, fhirmapper_1.mapImmigrationRecordToSearchBundle)(results);
            return bundle;
        }
        else
            return fhir_responses_1.FhirAPIResponses.RecordInitialized;
    }
    async findByBirthDate(startDate, endDate, pager) {
        return this.repo.findByBirthDate(startDate, endDate, pager);
    }
    async findByCountry(country, pager) {
        return this.repo.findByCountry(country, pager);
    }
    async findByEntryDate(startDate, endDate, pager) {
        return this.repo.findByEntryDate(startDate, endDate, pager);
    }
    async findByPassportExpiryDate(startDate, endDate, pager) {
        return this.repo.findByPassportExpiryDate(startDate, endDate, pager);
    }
    async findBySex(sex, pager) {
        return this.repo.findBySex(sex, pager);
    }
    async getByFullNameNonFHIR(firstName, lastName, pager) {
        const names = firstName.split(' ');
        if (names.length > 1) {
            return this.repo.getByNameWithMiddleName(names[0].trim(), names[1].trim(), lastName, pager);
        }
        else {
            return this.repo.getByName(firstName, lastName, pager);
        }
    }
    async getByFullName(firstName, lastName, pager) {
        const names = firstName.split(' ');
        try {
            const results = await this.getByFullNameNonFHIR(firstName, lastName, pager);
            if (results.length > 0) {
                const bundle = (0, fhirmapper_1.mapImmigrationRecordToSearchBundle)(results);
                return bundle;
            }
            else
                return fhir_responses_1.FhirAPIResponses.RecordInitialized;
        }
        catch (Exception) {
            this.logger.error("Error retrieving records in FHIR format \n " + Exception.message);
        }
    }
    async getByLastName(lastName, pager) {
        return this.repo.getByLastName(lastName, pager);
    }
    async getByPassportNo(passportNo, pager) {
        return this.repo.getMany(passportNo, pager);
    }
    async isOnline() {
        return this.repo.checkStatus();
    }
    async updateClientRegistryAsync(results, identifiers, configKey) {
        const searchParamValue = `${configKey}|${identifiers[0]}`;
        const searchBundle = await this.retryGetSearchBundleAsync(searchParamValue);
        if (this.needsUpdateOrIsEmpty(searchBundle)) {
            for (const result of results) {
                try {
                    const patient = (0, fhirmapper_1.mapImmigrationRecordToFhirPatient)(result);
                    await this.mpi.createPatient(patient);
                }
                catch (error) {
                    this.logger.error(`Error creating patient: ${error.message}`);
                }
            }
        }
    }
};
exports.ImmigrationService = ImmigrationService;
exports.ImmigrationService = ImmigrationService = ImmigrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(immigration_repository_1.ImmigrationRepository)),
    __param(1, (0, common_1.Inject)(mpi_1.MasterPatientIndex)),
    __metadata("design:paramtypes", [immigration_repository_1.ImmigrationRepository,
        mpi_1.MasterPatientIndex])
], ImmigrationService);
//# sourceMappingURL=immigration.service.js.map