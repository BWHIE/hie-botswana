"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const bdrs_controller_1 = require("./controllers/bdrs.controller");
const bdrs_service_1 = require("./services/bdrs.service");
const birth_module_1 = require("./modules/birth.module");
const death_module_1 = require("./modules/death.module");
const omang_module_1 = require("./modules/omang.module");
const omang_controller_1 = require("./controllers/omang.controller");
const omang_service_1 = require("./services/omang.service");
const mpi_module_1 = require("./modules/mpi.module");
const immigration_service_1 = require("./services/immigration.service");
const patient_controller_1 = require("./controllers/patient.controller");
const immigration_module_1 = require("./modules/immigration.module");
const patient_service_1 = require("./services/patient.service");
const middlewares_1 = require("./models/middlewares");
const authentification_1 = require("./models/authentification");
const user_module_1 = require("./modules/user.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            user_module_1.UserModule,
            birth_module_1.BirthModule,
            death_module_1.DeathModule,
            omang_module_1.OmangModule,
            mpi_module_1.MasterPatientIndexModule,
            immigration_module_1.ImmigrationModule,
        ],
        controllers: [app_controller_1.AppController, bdrs_controller_1.BDRSController, omang_controller_1.OmangController, patient_controller_1.PatientController],
        providers: [app_service_1.AppService, bdrs_service_1.BDRSService, omang_service_1.OmangService, immigration_service_1.ImmigrationService, patient_service_1.PatientService, middlewares_1.IpWhitelistGuard, authentification_1.BasicAuthGuard],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map