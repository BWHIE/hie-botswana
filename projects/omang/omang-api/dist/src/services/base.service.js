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
var BaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const common_1 = require("@nestjs/common");
const mpi_1 = require("./mpi");
const app_settings_json_1 = require("../app-settings.json");
let BaseService = BaseService_1 = class BaseService {
    constructor(mpi) {
        this.mpi = mpi;
        this.logger = new common_1.Logger(BaseService_1.name);
    }
    async retryGetSearchBundleAsync(searchParams) {
        const maxAttempts = 5;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                return this.mpi.getSearchBundle(searchParams);
            }
            catch (Exception) {
                this.logger.warn(`Attempt ${attempt} to get search bundle failed: ${Exception.message}`);
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
        {
        }
        this.logger.error("All attempts to get search bundle failed after " + maxAttempts + " retries.");
        return null;
    }
    needsUpdateOrIsEmpty(searchBundle) {
        if (!searchBundle || searchBundle.total === 0)
            return true;
        const maxDays = Number(app_settings_json_1.ClientRegistry.maxDaysBeforeUpdate);
        const lastUpdated = searchBundle.meta?.lastUpdated;
        return lastUpdated && (new Date().getTime() - new Date(lastUpdated).getTime() > maxDays * 24 * 60 * 60 * 1000);
    }
};
exports.BaseService = BaseService;
exports.BaseService = BaseService = BaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(mpi_1.MasterPatientIndex)),
    __metadata("design:paramtypes", [mpi_1.MasterPatientIndex])
], BaseService);
//# sourceMappingURL=base.service.js.map