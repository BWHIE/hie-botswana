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
var PatientController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientController = void 0;
const common_1 = require("@nestjs/common");
const omang_1 = require("../models/omang");
const immigration_service_1 = require("../services/immigration.service");
const patient_service_1 = require("../services/patient.service");
const authentification_1 = require("../models/authentification");
let PatientController = PatientController_1 = class PatientController {
    constructor(immigration, patients) {
        this.immigration = immigration;
        this.patients = patients;
        this.logger = new common_1.Logger(PatientController_1.name);
    }
    async online() {
        try {
            return this.immigration.isOnline();
        }
        catch (ex) {
            this.logger.error(ex);
            throw new common_1.InternalServerErrorException();
        }
    }
    async get(identifier) {
        try {
            if (!identifier || !identifier.includes('|')) {
                throw new common_1.BadRequestException();
            }
            const [system, id] = identifier.split('|');
            const result = await this.patients.getPatientByID(id, system);
            return result;
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
    async getByID(ID) {
        try {
            if (!ID) {
                throw new common_1.BadRequestException();
            }
            const bundle = await this.immigration.getPatientByPassportNumber(ID, { pageNum: 1, pageSize: 1 });
            return bundle;
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
    async getPatientByFullName(givenNames, lastName, system, pageNum = 1, pageSize = 100) {
        try {
            const bundle = await this.patients.getPatientByFullName(givenNames, lastName, system, new omang_1.Pager(pageNum, pageSize));
            return bundle;
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
};
exports.PatientController = PatientController;
__decorate([
    (0, common_1.Get)('Online'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "online", null);
__decorate([
    (0, common_1.Get)('Get'),
    __param(0, (0, common_1.Query)('identifier')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "get", null);
__decorate([
    (0, common_1.Get)('GetByID'),
    __param(0, (0, common_1.Query)('ID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "getByID", null);
__decorate([
    (0, common_1.Get)('GetPatientByFullName'),
    __param(0, (0, common_1.Query)('givenNames')),
    __param(1, (0, common_1.Query)('lastName')),
    __param(2, (0, common_1.Query)('system')),
    __param(3, (0, common_1.Query)('pageNum')),
    __param(4, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], PatientController.prototype, "getPatientByFullName", null);
exports.PatientController = PatientController = PatientController_1 = __decorate([
    (0, common_1.Controller)('api/patient'),
    (0, common_1.UseGuards)(authentification_1.BasicAuthGuard),
    __metadata("design:paramtypes", [immigration_service_1.ImmigrationService,
        patient_service_1.PatientService])
], PatientController);
//# sourceMappingURL=patient.controller.js.map