"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FhirAPIResponses = void 0;
const uuid_1 = require("uuid");
class FhirAPIResponses {
    static get RecordInitialized() {
        const bundle = {
            resourceType: 'Bundle',
            id: (0, uuid_1.v4)(),
            meta: {
                lastUpdated: new Date().toISOString()
            },
            type: "searchset",
            total: 0,
            entry: []
        };
        return bundle;
    }
}
exports.FhirAPIResponses = FhirAPIResponses;
//# sourceMappingURL=fhir-responses.js.map