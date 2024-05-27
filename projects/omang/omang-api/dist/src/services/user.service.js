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
var UserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const authentification_1 = require("../models/authentification");
const app_settings_json_1 = require("../app-settings.json");
let UserService = UserService_1 = class UserService {
    constructor() {
        this.logger = new common_1.Logger(UserService_1.name);
    }
    async authenticate(username, password) {
        try {
            this.logger.log(`Received an authentication request for user: ${username}`);
            const id = app_settings_json_1.Auth.Basic.Id;
            const configUsername = app_settings_json_1.Auth.Basic.Username;
            const configPassword = app_settings_json_1.Auth.Basic.Password;
            return (username === configUsername && password === configPassword) ? new authentification_1.User(id, username, password) : null;
        }
        catch (error) {
            this.logger.error(error);
            return null;
        }
    }
    async getAllUsers() {
        throw new Error('Method not implemented');
    }
};
exports.UserService = UserService;
exports.UserService = UserService = UserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UserService);
//# sourceMappingURL=user.service.js.map