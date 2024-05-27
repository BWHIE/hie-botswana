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
var MediatorModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediatorModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mediator_service_1 = require("./mediator/mediator.service");
const app_service_1 = require("./app.service");
let MediatorModule = MediatorModule_1 = class MediatorModule {
    constructor(mediatorService) {
        this.mediatorService = mediatorService;
        this.logger = new common_1.Logger(MediatorModule_1.name);
    }
    async onApplicationBootstrap() {
        await this.mediatorService.start(() => this.logger.log(`SHR Server is running and listening on port: 3000}`));
    }
};
exports.MediatorModule = MediatorModule;
exports.MediatorModule = MediatorModule = MediatorModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(),
        ],
        providers: [mediator_service_1.MediatorService, app_service_1.AppService],
    }),
    __metadata("design:paramtypes", [mediator_service_1.MediatorService])
], MediatorModule);
//# sourceMappingURL=mediator.module.js.map