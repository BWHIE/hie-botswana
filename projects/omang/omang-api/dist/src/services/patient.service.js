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
var PatientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientService = void 0;
const common_1 = require("@nestjs/common");
const immigration_service_1 = require("./immigration.service");
const bdrs_service_1 = require("./bdrs.service");
const omang_service_1 = require("./omang.service");
const mpi_1 = require("./mpi");
const app_settings_json_1 = require("../app-settings.json");
const omang_1 = require("../models/omang");
let PatientService = PatientService_1 = class PatientService {
    constructor(mpi, omang, bdrs, immigration) {
        this.mpi = mpi;
        this.omang = omang;
        this.bdrs = bdrs;
        this.immigration = immigration;
        this.logger = new common_1.Logger(PatientService_1.name);
    }
    async getPatientByFHIRName(name) {
        throw new Error('Method not implemented');
    }
    async getPatientByFullName(firstName, lastName, system, pager) {
        this.logger.log('Getting patient by Full Name');
        if (system === app_settings_json_1.ClientRegistry.OmangSystem) {
            return this.omang.findOmangByFullName(firstName, lastName, pager);
        }
        else if (system === app_settings_json_1.ClientRegistry.ImmigrationSystem) {
            return this.immigration.getByFullName(firstName, lastName, pager);
        }
        else if (system === app_settings_json_1.ClientRegistry.BdrsSystem) {
            return this.bdrs.findBirthByFullNameFHIR(firstName, lastName, pager);
        }
        else
            throw new Error('System Not Supported');
    }
    async getPatientByID(identifier, system) {
        this.logger.log('Getting patient by ID');
        if (system === app_settings_json_1.ClientRegistry.OmangSystem) {
            return this.omang.getOmangByID([identifier], new omang_1.Pager(1, 1));
        }
        else if (system === app_settings_json_1.ClientRegistry.ImmigrationSystem) {
            return this.immigration.getPatientByPassportNumber(identifier, new omang_1.Pager(1, 1));
        }
        else if (system === app_settings_json_1.ClientRegistry.BdrsSystem) {
            return this.bdrs.getBirthByID([identifier], new omang_1.Pager(1, 1));
        }
        else
            throw new Error('System Not Supported');
    }
    async isOnline() {
        return this.immigration.isOnline();
    }
};
exports.PatientService = PatientService;
exports.PatientService = PatientService = PatientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(mpi_1.MasterPatientIndex)),
    __param(1, (0, common_1.Inject)(omang_service_1.OmangService)),
    __param(2, (0, common_1.Inject)(bdrs_service_1.BDRSService)),
    __param(3, (0, common_1.Inject)(immigration_service_1.ImmigrationService)),
    __metadata("design:paramtypes", [mpi_1.MasterPatientIndex,
        omang_service_1.OmangService,
        bdrs_service_1.BDRSService,
        immigration_service_1.ImmigrationService])
], PatientService);
//# sourceMappingURL=patient.service.js.map