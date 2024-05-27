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
var OmangController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmangController = void 0;
const common_1 = require("@nestjs/common");
const omang_1 = require("../models/omang");
const omang_service_1 = require("../services/omang.service");
const authentification_1 = require("../models/authentification");
let OmangController = OmangController_1 = class OmangController {
    constructor(omang) {
        this.omang = omang;
        this.logger = new common_1.Logger(OmangController_1.name);
    }
    async online() {
        try {
            return this.omang.isOnline();
        }
        catch (ex) {
            this.logger.error(ex);
            throw new common_1.InternalServerErrorException();
        }
    }
    async getByID(ID, pageNum = 1, pageSize = 100) {
        try {
            if (!ID || ID.length === 0) {
                throw new common_1.BadRequestException('ID parameter is required');
            }
            const idArray = Array.isArray(ID) ? ID : [ID];
            const bundle = await this.omang.getOmangByID(idArray, new omang_1.Pager(pageNum, pageSize));
            return bundle;
        }
        catch (ex) {
            this.logger.error(ex);
            throw new common_1.InternalServerErrorException();
        }
    }
    async getByIDNonFHIR(ID, pageNum = 1, pageSize = 100) {
        try {
            if (!ID || ID.length === 0) {
                throw new common_1.BadRequestException();
            }
            const idArray = Array.isArray(ID) ? ID : [ID];
            const result = await this.omang.getOmangByIDNonFHIR(idArray, new omang_1.Pager(pageNum, pageSize));
            if (result) {
                return result;
            }
            else {
                return `No record with ID '${ID}' found.`;
            }
        }
        catch (ex) {
            this.logger.error(ex);
            throw new common_1.InternalServerErrorException();
        }
    }
    async findByFullName(givenNames, lastName, pageSize = 100, pageNum = 1) {
        try {
            if (!lastName || !givenNames) {
                throw new common_1.BadRequestException();
            }
            givenNames = givenNames.trim();
            lastName = lastName.trim();
            const bundle = await this.omang.findOmangByFullName(givenNames, lastName, new omang_1.Pager(pageNum, pageSize));
            return bundle;
        }
        catch (ex) {
            this.logger.error(ex);
            throw new common_1.InternalServerErrorException();
        }
    }
    async findByFullNameNonFHIR(givenNames, lastName, pageSize = 100, pageNum = 1) {
        try {
            if (!lastName || !givenNames) {
                throw new common_1.BadRequestException();
            }
            givenNames = givenNames.trim();
            lastName = lastName.trim();
            const result = await this.omang.findOmangByFullNameNonFHIR(givenNames, lastName, new omang_1.Pager(pageNum, pageSize));
            if (result) {
                return result;
            }
            else {
                return `No record with full name '${lastName}' '${givenNames}' found.`;
            }
        }
        catch (ex) {
            this.logger.error(ex);
            throw new common_1.InternalServerErrorException();
        }
    }
    async findByLastName(lastName, pageSize = 100, pageNum = 1) {
        try {
            if (!lastName) {
                throw new common_1.BadRequestException();
            }
            lastName = lastName.trim();
            const bundle = await this.omang.findOmangByLastName(lastName, new omang_1.Pager(pageNum, pageSize));
            return bundle;
        }
        catch (ex) {
            this.logger.error(ex);
            throw new common_1.InternalServerErrorException();
        }
    }
    async findByLastNameNonFHIR(lastName, pageSize = 100, pageNum = 1) {
        try {
            if (!lastName) {
                throw new common_1.BadRequestException();
            }
            lastName = lastName.trim();
            const result = await this.omang.findOmangByLastNameNonFHIR(lastName, new omang_1.Pager(pageNum, pageSize));
            if (result) {
                return result;
            }
            else {
                return `No record with last name '${lastName}' found.`;
            }
        }
        catch (ex) {
            this.logger.error(ex);
            throw new common_1.InternalServerErrorException();
        }
    }
    async findDeceasedNonFHIR(startDate, endDate, pageNum = 1, pageSize = 100) {
        try {
            if (!startDate) {
                throw new common_1.BadRequestException('startDate parameter is required');
            }
            let start = new Date(startDate);
            let end = endDate ? new Date(endDate) : new Date();
            const result = await this.omang.findOmangByDeceasedDateNonFHIR(start, end, new omang_1.Pager(pageNum, pageSize));
            if (result) {
                return result;
            }
            else {
                return 'No record with parameters provided found.';
            }
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
    async findChangedNonFHIR(startDate, endDate, pageNum = 1, pageSize = 100) {
        try {
            if (!startDate) {
                throw new common_1.BadRequestException('startDate parameter is required');
            }
            let start = new Date(startDate);
            let end = endDate ? new Date(endDate) : new Date();
            const result = await this.omang.findOmangByChangeDateNonFHIR(start, end, new omang_1.Pager(pageNum, pageSize));
            if (result) {
                return result;
            }
            else {
                return 'No record with parameters provided found.';
            }
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
    async findChangedFHIR(startDate, endDate, pageNum = 1, pageSize = 100) {
        try {
            if (!startDate) {
                throw new common_1.BadRequestException('startDate parameter is required');
            }
            let start = new Date(startDate);
            let end = endDate ? new Date(endDate) : new Date();
            const result = await this.omang.findOmangByChangeDate(start, end, new omang_1.Pager(pageNum, pageSize));
            if (result) {
                return result;
            }
            else {
                return 'No record with parameters provided found.';
            }
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
    async findDeceasedFHIR(startDate, endDate, pageNum = 1, pageSize = 100) {
        try {
            if (!startDate) {
                throw new common_1.BadRequestException('startDate parameter is required');
            }
            let start = new Date(startDate);
            let end = endDate ? new Date(endDate) : new Date();
            const result = await this.omang.findOmangByDeceasedDate(start, end, new omang_1.Pager(pageNum, pageSize));
            if (result) {
                return result;
            }
            else {
                return 'No record with parameters provided found.';
            }
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
};
exports.OmangController = OmangController;
__decorate([
    (0, common_1.Get)('Online'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OmangController.prototype, "online", null);
__decorate([
    (0, common_1.Get)('GetByID'),
    __param(0, (0, common_1.Query)('ID')),
    __param(1, (0, common_1.Query)('pageNum')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object, Object]),
    __metadata("design:returntype", Promise)
], OmangController.prototype, "getByID", null);
__decorate([
    (0, common_1.Get)('GetByIDNonFHIR'),
    __param(0, (0, common_1.Query)('ID')),
    __param(1, (0, common_1.Query)('pageNum')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object, Object]),
    __metadata("design:returntype", Promise)
], OmangController.prototype, "getByIDNonFHIR", null);
__decorate([
    (0, common_1.Get)('findByFullName'),
    __param(0, (0, common_1.Query)('givenNames')),
    __param(1, (0, common_1.Query)('lastName')),
    __param(2, (0, common_1.Query)('pageSize')),
    __param(3, (0, common_1.Query)('pageNum')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], OmangController.prototype, "findByFullName", null);
__decorate([
    (0, common_1.Get)('FindByFullNameNonFHIR'),
    __param(0, (0, common_1.Query)('givenNames')),
    __param(1, (0, common_1.Query)('lastName')),
    __param(2, (0, common_1.Query)('pageSize')),
    __param(3, (0, common_1.Query)('pageNum')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], OmangController.prototype, "findByFullNameNonFHIR", null);
__decorate([
    (0, common_1.Get)('FindByLastName'),
    __param(0, (0, common_1.Query)('lastName')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('pageNum')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OmangController.prototype, "findByLastName", null);
__decorate([
    (0, common_1.Get)('FindByLastNameNonFHIR'),
    __param(0, (0, common_1.Query)('lastName')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('pageNum')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OmangController.prototype, "findByLastNameNonFHIR", null);
__decorate([
    (0, common_1.Get)('DeceasedNonFHIR'),
    __param(0, (0, common_1.Query)('deceasedStartDate')),
    __param(1, (0, common_1.Query)('deceasedEndDate')),
    __param(2, (0, common_1.Query)('pageNum')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], OmangController.prototype, "findDeceasedNonFHIR", null);
__decorate([
    (0, common_1.Get)('ChangedNonFHIR'),
    __param(0, (0, common_1.Query)('changeStartDate')),
    __param(1, (0, common_1.Query)('changeEndDate')),
    __param(2, (0, common_1.Query)('pageNum')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], OmangController.prototype, "findChangedNonFHIR", null);
__decorate([
    (0, common_1.Get)('Changed'),
    __param(0, (0, common_1.Query)('changeStartDate')),
    __param(1, (0, common_1.Query)('changeEndDate')),
    __param(2, (0, common_1.Query)('pageNum')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], OmangController.prototype, "findChangedFHIR", null);
__decorate([
    (0, common_1.Get)('Deceased'),
    __param(0, (0, common_1.Query)('deceasedStartDate')),
    __param(1, (0, common_1.Query)('deceasedEndDate')),
    __param(2, (0, common_1.Query)('pageNum')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], OmangController.prototype, "findDeceasedFHIR", null);
exports.OmangController = OmangController = OmangController_1 = __decorate([
    (0, common_1.Controller)('api/omang'),
    (0, common_1.UseGuards)(authentification_1.BasicAuthGuard),
    __metadata("design:paramtypes", [omang_service_1.OmangService])
], OmangController);
//# sourceMappingURL=omang.controller.js.map