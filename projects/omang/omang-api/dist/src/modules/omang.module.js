"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmangModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const omang_repository_1 = require("../data/omang-repository");
const typeorm_2 = require("typeorm");
const ormconfig_1 = require("../config/ormconfig");
let OmangModule = class OmangModule {
};
exports.OmangModule = OmangModule;
exports.OmangModule = OmangModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([], 'omangConnection'),
            (0, common_1.forwardRef)(() => OmangModule)
        ],
        providers: [
            {
                provide: 'omangConnectionDataSource',
                useFactory: async () => await (0, typeorm_2.createConnection)(ormconfig_1.omangDataSourceOptions),
            },
            omang_repository_1.OmangRepository,
        ],
        exports: [omang_repository_1.OmangRepository],
    })
], OmangModule);
//# sourceMappingURL=omang.module.js.map