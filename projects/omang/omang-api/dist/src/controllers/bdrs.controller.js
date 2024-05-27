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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BDRSController = void 0;
const common_1 = require("@nestjs/common");
const omang_1 = require("../models/omang");
const bdrs_service_1 = require("../services/bdrs.service");
const authentification_1 = require("../models/authentification");
let BDRSController = class BDRSController {
    constructor(bdrsService) {
        this.bdrsService = bdrsService;
        this.logger = new common_1.Logger('BDRSController');
    }
    async online() {
        try {
            return await this.bdrsService.isOnline();
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
    async getBirthByID(ID, pageNum = 1, pageSize = 100) {
        try {
            if (!ID || ID.length === 0) {
                throw new common_1.BadRequestException('ID parameter is required');
            }
            const idArray = Array.isArray(ID) ? ID : [ID];
            const bundle = await this.bdrsService.getBirthByID(idArray, new omang_1.Pager(pageNum, pageSize));
            return bundle;
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
    async getDeathByID(ID, pageNum = 1, pageSize = 100) {
        try {
            if (!ID || ID.length === 0) {
                throw new common_1.BadRequestException('ID parameter is required');
            }
            const idArray = Array.isArray(ID) ? ID : [ID];
            const bundle = await this.bdrsService.getDeathByID(idArray, new omang_1.Pager(pageNum, pageSize));
            return bundle;
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
    async findBirthByFullName(givenNames, lastName, pageNum = 1, pageSize = 100) {
        try {
            if (!givenNames || !lastName) {
                throw new common_1.BadRequestException('Both givenNames and lastName parameters are required');
            }
            givenNames = givenNames.trim();
            lastName = lastName.trim();
            const result = await this.bdrsService.findBirthByFullName(givenNames, lastName, new omang_1.Pager(pageNum, pageSize));
            if (result) {
                return result;
            }
            else {
                return `No record with Name '${givenNames} ${lastName}' found.`;
            }
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
    async findDeathByFullName(givenNames, lastName, pageNum = 1, pageSize = 100) {
        try {
            if (!givenNames || !lastName) {
                throw new common_1.BadRequestException('Both givenNames and lastName parameters are required');
            }
            givenNames = givenNames.trim();
            lastName = lastName.trim();
            const result = await this.bdrsService.findDeathByFullName(givenNames, lastName, new omang_1.Pager(pageNum, pageSize));
            if (result) {
                return result;
            }
            else {
                return `No record with Name '${givenNames} ${lastName}' found.`;
            }
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
    async findBirthByLastName(LastName, pageNum = 1, pageSize = 100) {
        try {
            if (!LastName) {
                throw new common_1.BadRequestException('lastName parameter is required');
            }
            LastName = LastName.trim();
            const result = await this.bdrsService.findBirthByLastName(LastName, new omang_1.Pager(pageNum, pageSize));
            if (result) {
                return result;
            }
            else {
                return `No record with LastName '${LastName}' found.`;
            }
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
    async findDeathByLastName(lastName, pageNum = 1, pageSize = 100) {
        try {
            if (!lastName) {
                throw new common_1.BadRequestException('lastName parameter is required');
            }
            lastName = lastName.trim();
            const result = await this.bdrsService.findDeathByLastName(lastName, new omang_1.Pager(pageNum, pageSize));
            if (result) {
                return result;
            }
            else {
                return `No record with LastName '${lastName}' found.`;
            }
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException();
        }
    }
    async birthsByDate(startDate, endDate, pageNum = 1, pageSize = 100) {
        try {
            if (!startDate) {
                throw new common_1.BadRequestException('startDate parameter is required');
            }
            let start = new Date(startDate);
            let end = endDate ? new Date(endDate) : new Date();
            const result = await this.bdrsService.findBirthsByDate(start, end, new omang_1.Pager(pageNum, pageSize));
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
    async deathsByDate(startDate, endDate, pageNum = 1, pageSize = 100) {
        try {
            if (!startDate) {
                throw new common_1.BadRequestException('startDate parameter is required');
            }
            let start = new Date(startDate);
            let end = endDate ? new Date(endDate) : new Date();
            const result = await this.bdrsService.findDeathsByDate(start, end, new omang_1.Pager(pageNum, pageSize));
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
exports.BDRSController = BDRSController;
__decorate([
    (0, common_1.Get)('Online'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BDRSController.prototype, "online", null);
__decorate([
    (0, common_1.Get)('GetByID'),
    __param(0, (0, common_1.Query)('ID')),
    __param(1, (0, common_1.Query)('pageNum')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Number, Number]),
    __metadata("design:returntype", Promise)
], BDRSController.prototype, "getBirthByID", null);
__decorate([
    (0, common_1.Get)('GetDeathByID'),
    __param(0, (0, common_1.Query)('ID')),
    __param(1, (0, common_1.Query)('pageNum')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Number, Number]),
    __metadata("design:returntype", Promise)
], BDRSController.prototype, "getDeathByID", null);
__decorate([
    (0, common_1.Get)('FindBirthByFullName'),
    __param(0, (0, common_1.Query)('givenNames')),
    __param(1, (0, common_1.Query)('lastName')),
    __param(2, (0, common_1.Query)('pageNum')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], BDRSController.prototype, "findBirthByFullName", null);
__decorate([
    (0, common_1.Get)('FindDeathByFullName'),
    __param(0, (0, common_1.Query)('givenNames')),
    __param(1, (0, common_1.Query)('lastName')),
    __param(2, (0, common_1.Query)('pageNum')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], BDRSController.prototype, "findDeathByFullName", null);
__decorate([
    (0, common_1.Get)('FindBirthByLastName'),
    __param(0, (0, common_1.Query)('lastName')),
    __param(1, (0, common_1.Query)('pageNum')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], BDRSController.prototype, "findBirthByLastName", null);
__decorate([
    (0, common_1.Get)('FindDeathByLastName'),
    __param(0, (0, common_1.Query)('lastName')),
    __param(1, (0, common_1.Query)('pageNum')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], BDRSController.prototype, "findDeathByLastName", null);
__decorate([
    (0, common_1.Get)('BirthsByDate'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('pageNum')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], BDRSController.prototype, "birthsByDate", null);
__decorate([
    (0, common_1.Get)('DeathsByDate'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('pageNum')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], BDRSController.prototype, "deathsByDate", null);
exports.BDRSController = BDRSController = __decorate([
    (0, common_1.Controller)('api/bdrs'),
    (0, common_1.UseGuards)(authentification_1.BasicAuthGuard),
    __metadata("design:paramtypes", [bdrs_service_1.BDRSService])
], BDRSController);
//# sourceMappingURL=bdrs.controller.js.map