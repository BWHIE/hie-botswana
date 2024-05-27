export declare class Pager {
    pageNum: number;
    pageSize: number;
    constructor(pageNum: number, pageSize: number);
}
export declare class Omang {
    IdNo: string;
    FirstName: string;
    Surname: string;
    BirthDate: Date | null;
    BirthDateUnknown: string;
    BirthPlace: string;
    DistrictName: string;
    PersonStatus: string;
    DistrictCode: string;
    Sex: string;
    SpouseName: string;
    CitizenStatusCode: string;
    CitizenStatusDate: Date | null;
    DeathCertificateNo: string;
    DeceasedDate: Date | null;
    DeceasedDateUnknown: string;
    MaritalStatusCode: string;
    MaritalStatusDescription: string;
    ChangeDate: Date | null;
    ExpiryDate: Date | null;
    PostalAddress: string;
    ResidentialAddress: string;
    constructor(init?: Partial<Omang>);
}
export declare class BWFHIRMeta {
    Profile: string[];
    constructor(init?: Partial<BWFHIRMeta>);
}
export declare class BWFHIRBaseObject {
    ResourceType: string;
    Id: string;
    Meta: BWFHIRMeta;
    constructor(init?: Partial<BWFHIRBaseObject>);
}
export declare class BWFHIRName {
    Use: string;
    Family: string;
    Given: string[];
    constructor(init?: Partial<BWFHIRName>);
}
export declare class BWFHIRAddress {
    District: string;
    PostalCode: string;
    constructor(init?: Partial<BWFHIRAddress>);
}
export declare class BWFHIRCode {
    Code: string;
    constructor(init?: Partial<BWFHIRCode>);
}
export declare class BWFHIRCoding {
    Coding: BWFHIRCode[];
    constructor(init?: Partial<BWFHIRCoding>);
}
export declare class BWFHIRIdentifier {
    Use: string;
    System: string;
    Value: string;
    constructor(init?: Partial<BWFHIRIdentifier>);
}
export declare class BWFHIRPatient extends BWFHIRBaseObject {
    Identifier: BWFHIRIdentifier[];
    Name: BWFHIRName[];
    Gender: string;
    BirthDate: Date | null;
    DeceasedDateTime: Date | null;
    Address: BWFHIRAddress[];
    MaritalStatus: BWFHIRCoding;
    constructor();
}
export declare class OmangFHIRPatient extends BWFHIRBaseObject {
    Identifier: BWFHIRIdentifier[];
    Name: BWFHIRName[];
    Gender: string;
    BirthDate: Date | null;
    DeceasedDateTime: Date | null;
    Address: BWFHIRAddress[];
    MaritalStatus: BWFHIRCoding;
    constructor();
}
