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
var OmangService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmangService = void 0;
const common_1 = require("@nestjs/common");
const omang_repository_1 = require("../data/omang-repository");
const fhirmapper_1 = require("../utils/fhirmapper");
const fhir_responses_1 = require("../models/fhir-responses");
const base_service_1 = require("./base.service");
const mpi_1 = require("./mpi");
let OmangService = OmangService_1 = class OmangService extends base_service_1.BaseService {
    constructor(repo, mpi) {
        super(mpi);
        this.repo = repo;
        this.mpi = mpi;
        this.logger = new common_1.Logger(OmangService_1.name);
    }
    async getOmangByID(ID, pager) {
        const results = await this.repo.getMany(ID, pager);
        if (results.length > 0) {
            const omangBundle = (0, fhirmapper_1.mapOmangToSearchBundle)(results);
            return omangBundle;
        }
        else
            return fhir_responses_1.FhirAPIResponses.RecordInitialized;
    }
    async isOnline() {
        return this.repo.checkStatus();
    }
    async findOmangByChangeDate(changeStartDate, changeEndDate, pager) {
        const results = await this.repo.getChanged(changeStartDate, changeEndDate, pager);
        if (results.length > 0) {
            return (0, fhirmapper_1.mapOmangToSearchBundle)(results);
        }
        else
            return fhir_responses_1.FhirAPIResponses.RecordInitialized;
    }
    async findOmangByChangeDateNonFHIR(changeStartDate, changeEndDate, pager) {
        return this.repo.getChanged(changeStartDate, changeEndDate, pager);
    }
    async findOmangByDeceasedDate(deceasedStartDate, deceasedEndDate, pager) {
        const results = await this.repo.getDeceased(deceasedStartDate, deceasedEndDate, pager);
        if (results.length > 0) {
            return (0, fhirmapper_1.mapOmangToSearchBundle)(results);
        }
        else
            return fhir_responses_1.FhirAPIResponses.RecordInitialized;
    }
    async findOmangByDeceasedDateNonFHIR(deceasedStartDate, deceasedEndDate, pager) {
        return this.repo.getDeceased(deceasedStartDate, deceasedEndDate, pager);
    }
    async findOmangByFullName(firstName, lastName, pager) {
        const results = await this.repo.getByName(firstName, lastName, pager);
        if (results.length > 0) {
            return (0, fhirmapper_1.mapOmangToSearchBundle)(results);
        }
        else
            return fhir_responses_1.FhirAPIResponses.RecordInitialized;
    }
    async findOmangByFullNameNonFHIR(firstName, lastName, pager) {
        return this.repo.getByName(firstName, lastName, pager);
    }
    async findOmangByLastName(lastName, pager) {
        const results = await this.repo.getByLastName(lastName, pager);
        if (results.length > 0) {
            return (0, fhirmapper_1.mapOmangToSearchBundle)(results);
        }
        else
            return fhir_responses_1.FhirAPIResponses.RecordInitialized;
    }
    async findOmangByLastNameNonFHIR(lastName, pager) {
        return this.repo.getByLastName(lastName, pager);
    }
    async getOmangByIDNonFHIR(ID, pager) {
        return this.repo.getMany(ID, pager);
    }
    async updateClientRegistryAsync(results, identifiers, configKey) {
        const searchParamValue = `${configKey}|${identifiers[0]}`;
        const searchBundle = await this.retryGetSearchBundleAsync(searchParamValue);
        console.log(searchBundle);
        if (this.needsUpdateOrIsEmpty(searchBundle)) {
            for (const result of results) {
                try {
                    const patient = (0, fhirmapper_1.mapOmangToFhirPatient)(result);
                    console.log('our patient is as follows ' + patient);
                    await this.mpi.createPatient(patient);
                }
                catch (error) {
                    this.logger.error(`Error creating patient: ${error.message}`);
                }
            }
        }
    }
};
exports.OmangService = OmangService;
exports.OmangService = OmangService = OmangService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(omang_repository_1.OmangRepository)),
    __param(1, (0, common_1.Inject)(mpi_1.MasterPatientIndex)),
    __metadata("design:paramtypes", [omang_repository_1.OmangRepository,
        mpi_1.MasterPatientIndex])
], OmangService);
//# sourceMappingURL=omang.service.js.map