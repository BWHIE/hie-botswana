export class Omang {
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

  constructor(init?: Partial<Omang>) {
    Object.assign(this, init);
  }
}

export class BWFHIRMeta {
  Profile: string[];

  constructor(init?: Partial<BWFHIRMeta>) {
    Object.assign(this, init);
  }
}

export class BWFHIRBaseObject {
  ResourceType: string;
  Id: string;
  Meta: BWFHIRMeta;

  constructor(init?: Partial<BWFHIRBaseObject>) {
    Object.assign(this, init);
  }
}

export class BWFHIRName {
  Use: string;
  Family: string;
  Given: string[];

  constructor(init?: Partial<BWFHIRName>) {
    Object.assign(this, init);
  }
}

export class BWFHIRAddress {
  District: string;
  PostalCode: string;

  constructor(init?: Partial<BWFHIRAddress>) {
    Object.assign(this, init);
  }
}

export class BWFHIRCode {
  Code: string;

  constructor(init?: Partial<BWFHIRCode>) {
    Object.assign(this, init);
  }
}

export class BWFHIRCoding {
  Coding: BWFHIRCode[];
  constructor(init?: Partial<BWFHIRCoding>) {
    Object.assign(this, init);
  }
}

export class BWFHIRIdentifier {
  Use: string;
  System: string;
  Value: string;

  constructor(init?: Partial<BWFHIRIdentifier>) {
    Object.assign(this, init);
  }
}

export class BWFHIRPatient extends BWFHIRBaseObject {
  Identifier: BWFHIRIdentifier[];
  Name: BWFHIRName[];
  Gender: string;
  BirthDate: Date | null;
  DeceasedDateTime: Date | null;
  Address: BWFHIRAddress[];
  MaritalStatus: BWFHIRCoding;

  constructor() {
    super();
    this.ResourceType = 'Patient';
    this.Meta = new BWFHIRMeta({
      Profile: [
        'http://b-techbw.github.io/bw-lab-ig/StructureDefinition/omang-patient',
      ],
    });

    this.Identifier = [
      new BWFHIRIdentifier({
        Use: 'official',
        System: 'http://moh.bw.org/ext/identifier/omang',
      }),
    ];

    this.Name = [
      new BWFHIRName({
        Use: 'official',
      }),
    ];
  }
}

export class OmangFHIRPatient extends BWFHIRBaseObject {
  // Identifier: BWFHIRIdentifier[];
  // Name: BWFHIRName[];
  public Identifier: BWFHIRIdentifier[];
  public Name: BWFHIRName[];
  public Gender: string;
  public BirthDate: Date | null;
  public DeceasedDateTime: Date | null;
  public Address: BWFHIRAddress[];
  public MaritalStatus: BWFHIRCoding;

  constructor() {
    super();
    this.ResourceType = 'Patient';
    this.Meta = new BWFHIRMeta({
      Profile: [
        'http://b-techbw.github.io/bw-lab-ig/StructureDefinition/omang-patient',
      ],
    });

    this.Identifier = [
      new BWFHIRIdentifier({
        Use: 'official',
        System: 'http://moh.bw.org/ext/identifier/omang',
      }),
    ];

    this.Name = [
      new BWFHIRName({
        Use: 'official',
      }),
    ];
  }
}
