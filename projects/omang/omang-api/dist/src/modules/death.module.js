"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeathModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bdrs_repositories_1 = require("../data/bdrs-repositories");
const typeorm_2 = require("typeorm");
const ormconfig_1 = require("../config/ormconfig");
let DeathModule = class DeathModule {
};
exports.DeathModule = DeathModule;
exports.DeathModule = DeathModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([], 'deathConnection'),
            (0, common_1.forwardRef)(() => DeathModule)
        ],
        providers: [
            {
                provide: 'deathConnectionDataSource',
                useFactory: async () => await (0, typeorm_2.createConnection)(ormconfig_1.deathDataSourceOptions),
            },
            bdrs_repositories_1.DeathRepository,
        ],
        exports: [bdrs_repositories_1.DeathRepository],
    })
], DeathModule);
//# sourceMappingURL=death.module.js.map