"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpWhitelistGuard = void 0;
const common_1 = require("@nestjs/common");
const app_settings_json_1 = require("../app-settings.json");
let IpWhitelistGuard = class IpWhitelistGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const clientIp = this.getClientIp(request);
        const safelist = app_settings_json_1.SafeList.IP.split(';');
        if (!safelist.includes(clientIp)) {
            throw new common_1.ForbiddenException('Forbidden request from remote IP address: ' + clientIp);
        }
        return true;
    }
    getClientIp(request) {
        const xForwardedFor = request.headers['x-forwarded-for'];
        if (xForwardedFor) {
            return xForwardedFor.split(',')[0].trim();
        }
        return request.connection.remoteAddress;
    }
};
exports.IpWhitelistGuard = IpWhitelistGuard;
exports.IpWhitelistGuard = IpWhitelistGuard = __decorate([
    (0, common_1.Injectable)()
], IpWhitelistGuard);
//# sourceMappingURL=middlewares.js.map