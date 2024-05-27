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
var MediatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediatorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = require("fs");
const winston = require("winston");
const openhim_mediator_utils_1 = require("openhim-mediator-utils");
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const app_service_1 = require("../app.service");
const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
const config = JSON.parse(fs.readFileSync(`${__dirname}/../app-settings.json`, 'utf-8'));
const medConfig = config.mediatorConfig.mediatorSetup;
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'Mediator' },
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});
let MediatorService = MediatorService_1 = class MediatorService {
    constructor(configService, appService) {
        this.configService = configService;
        this.appService = appService;
        const env = process.env.NODE_ENV || 'development';
    }
    async start(callback) {
        logger.info('Running Service as a mediator with ' + `${__dirname}/${config}`);
        try {
            openhim_mediator_utils_1.default.registerMediator(config.mediatorConfig.openHimAuth, medConfig, MediatorService_1.registrationCallback(callback));
        }
        catch (e) {
            logger.error(`Could not start Service as a Mediator!\n${JSON.stringify(e)}`);
            process.exit(1);
        }
        errorTypes.map(type => {
            process.on(type, async (e) => {
                try {
                    logger.error(`Caught error: process.on ${type}`);
                    logger.error(e);
                    logger.error(e.stack);
                }
                catch (_) {
                    process.exit(1);
                }
            });
        });
        signalTraps.map(type => {
            process.once(type, async () => {
                try {
                    logger.info('Received signal:', type);
                }
                finally {
                    process.kill(process.pid, type);
                }
            });
        });
    }
    static registrationCallback(callback) {
        return (err) => {
            if (err) {
                logger.error('Failed to register mediator at ' +
                    config.mediatorConfig.mediatorCore.openHimCoreHost +
                    '\nCheck your config!\n');
                logger.error(err.stack || '');
                process.exit(1);
            }
            else {
                config.mediatorConfig.mediatorSetup.urn = medConfig.urn;
                openhim_mediator_utils_1.default.fetchConfig(config.mediatorConfig.openHimAuth, MediatorService_1.setupCallback(callback));
            }
        };
    }
    static setupCallback(callback) {
        return (err, initialConfig) => {
            if (err) {
                logger.error('Failed to fetch initial config');
                process.exit(1);
            }
            const updatedConfig = Object.assign(config, initialConfig);
            logger.info('Received initial config:', initialConfig);
            MediatorService_1.reloadConfig(updatedConfig, MediatorService_1.startupCallback(callback));
        };
    }
    static startupCallback(callback) {
        return async () => {
            try {
                config.mediatorConfig.mediatorSetup.urn = medConfig.urn;
                logger.info('Successfully registered mediator!');
                const app = await core_1.NestFactory.create(app_module_1.AppModule);
                const port = 5002;
                const server = app.listen(port, () => {
                    try {
                        const configEmitter = openhim_mediator_utils_1.default.activateHeartbeat(config.mediatorConfig.openHimAuth);
                        configEmitter.on('config', MediatorService_1.updateCallback(callback));
                    }
                    catch (error) {
                        logger.error(error);
                    }
                });
            }
            catch (error) {
                logger.error(error);
            }
        };
    }
    static updateCallback(callback) {
        return (newConfig) => {
            logger.info('Received updated config:', newConfig);
            const updatedConfig = Object.assign(medConfig, newConfig);
            MediatorService_1.reloadConfig(updatedConfig, () => {
                config.mediatorConfig.mediatorSetup.urn = medConfig.urn;
            });
        };
    }
    static reloadConfig(data, callback) {
        const tmpFile = `${__dirname}/../app-settings.json`;
        fs.writeFile(tmpFile, JSON.stringify(data), (err) => {
            if (err) {
                throw err;
            }
            Object.assign(medConfig, data);
            callback();
        });
    }
};
exports.MediatorService = MediatorService;
exports.MediatorService = MediatorService = MediatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, app_service_1.AppService])
], MediatorService);
//# sourceMappingURL=mediator.service.js.map