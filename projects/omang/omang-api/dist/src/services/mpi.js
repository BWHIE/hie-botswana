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
var MasterPatientIndex_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterPatientIndex = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const app_settings_json_1 = require("../app-settings.json");
const fhirclient_1 = require("fhirclient");
let MasterPatientIndex = MasterPatientIndex_1 = class MasterPatientIndex {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(MasterPatientIndex_1.name);
        this.clientRegistryUrl = `${app_settings_json_1.ClientRegistry.OpenhimUrl}${app_settings_json_1.ClientRegistry.CrChannel}`;
        const client = app_settings_json_1.ClientRegistry.OpenhimClient;
        const password = app_settings_json_1.ClientRegistry.OpenhimPassword;
        const authString = `${client}:${password}`;
        this.authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
        this.devMode = app_settings_json_1.ClientRegistry.devMode === 'true';
    }
    getHttpOptions() {
        const options = {
            headers: {
                Authorization: this.authHeader,
                'Content-Type': 'application/fhir+json',
            },
        };
        if (this.devMode) {
            options.httpsAgent = new (require('https').Agent)({
                rejectUnauthorized: false,
            });
        }
        return options;
    }
    async getSearchBundle(query) {
        let search_bundle = null;
        try {
            const fhirClient = fhirclient_1.default.client(this.clientRegistryUrl);
            let searchResponse = await fhirClient.patient.read({ 'identifier': query });
            console.log(searchResponse);
        }
        catch (Exception) {
            this.logger.error("Could not get CR bundle for patient with ID " + query + "\n" + Exception);
        }
    }
    async createPatient(patient) {
        try {
            if (patient.birthDate) {
                patient.birthDate = new Date(patient.birthDate).toISOString().split('T')[0];
            }
            delete patient.id;
            console.log(patient);
            console.log(this.clientRegistryUrl);
            const fhirClient = fhirclient_1.default.client(this.clientRegistryUrl);
            const response = fhirClient.create(patient).then(response => console.log(response));
            this.logger.log('Created patient!\n' + JSON.stringify(response));
            return response;
        }
        catch (error) {
            this.logger.error('Failed to create patient in CR:', error.stack);
            throw error;
        }
    }
};
exports.MasterPatientIndex = MasterPatientIndex;
exports.MasterPatientIndex = MasterPatientIndex = MasterPatientIndex_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], MasterPatientIndex);
//# sourceMappingURL=mpi.js.map