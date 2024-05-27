"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmangFHIRPatient = exports.BWFHIRPatient = exports.BWFHIRIdentifier = exports.BWFHIRCoding = exports.BWFHIRCode = exports.BWFHIRAddress = exports.BWFHIRName = exports.BWFHIRBaseObject = exports.BWFHIRMeta = exports.Omang = exports.Pager = void 0;
class Pager {
    constructor(pageNum, pageSize) {
        this.pageNum = pageNum;
        this.pageSize = pageSize;
    }
}
exports.Pager = Pager;
class Omang {
    constructor(init) {
        Object.assign(this, init);
    }
}
exports.Omang = Omang;
class BWFHIRMeta {
    constructor(init) {
        Object.assign(this, init);
    }
}
exports.BWFHIRMeta = BWFHIRMeta;
class BWFHIRBaseObject {
    constructor(init) {
        Object.assign(this, init);
    }
}
exports.BWFHIRBaseObject = BWFHIRBaseObject;
class BWFHIRName {
    constructor(init) {
        Object.assign(this, init);
    }
}
exports.BWFHIRName = BWFHIRName;
class BWFHIRAddress {
    constructor(init) {
        Object.assign(this, init);
    }
}
exports.BWFHIRAddress = BWFHIRAddress;
class BWFHIRCode {
    constructor(init) {
        Object.assign(this, init);
    }
}
exports.BWFHIRCode = BWFHIRCode;
class BWFHIRCoding {
    constructor(init) {
        Object.assign(this, init);
    }
}
exports.BWFHIRCoding = BWFHIRCoding;
class BWFHIRIdentifier {
    constructor(init) {
        Object.assign(this, init);
    }
}
exports.BWFHIRIdentifier = BWFHIRIdentifier;
class BWFHIRPatient extends BWFHIRBaseObject {
    constructor() {
        super();
        this.ResourceType = 'Patient';
        this.Meta = new BWFHIRMeta({
            Profile: ['http://b-techbw.github.io/bw-lab-ig/StructureDefinition/omang-patient']
        });
        this.Identifier = [
            new BWFHIRIdentifier({
                Use: 'official',
                System: 'http://moh.bw.org/ext/identifier/omang'
            })
        ];
        this.Name = [
            new BWFHIRName({
                Use: 'official'
            })
        ];
    }
}
exports.BWFHIRPatient = BWFHIRPatient;
class OmangFHIRPatient extends BWFHIRBaseObject {
    constructor() {
        super();
        this.ResourceType = 'Patient';
        this.Meta = new BWFHIRMeta({
            Profile: ['http://b-techbw.github.io/bw-lab-ig/StructureDefinition/omang-patient']
        });
        this.Identifier = [
            new BWFHIRIdentifier({
                Use: 'official',
                System: 'http://moh.bw.org/ext/identifier/omang'
            })
        ];
        this.Name = [
            new BWFHIRName({
                Use: 'official'
            })
        ];
    }
}
exports.OmangFHIRPatient = OmangFHIRPatient;
//# sourceMappingURL=omang.js.map