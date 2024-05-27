
export class BirthDeathRecord {

    public ID_NUMBER: string ;
    public BIRTH_CERTIFICATE: string ;
    public DEATH_CERTIFICATE: string ;
    public DISTRICT_OF_BIRTH_NAME: string ;
    public DISTRICT_OF_BIRTH: string ;
    public TYPE_OF_BIRTH: string ;
    public BIRTH_REGISTRATION_NUMBER: string ;
    public DISTRICT_OF_REGISTRATION: string ;
    public DISTRICT_OF_DEATH_NAME: string ;
    public DISTRICT_OF_DEATH: string ;
    public DEATH_REGISTRATION_NUMBER: string ;
    public FORENAME: string ;
    public SURNAME: string ;
    public OTHER_NAME: string ;
    public DATE_OF_BIRTH: Date | null ;
    public SEX: string ;
    public TOWN_VILL: string ;
    public WARD_STREET: string ;
    public NATIONALITY: string ;
    public OCCUPATION: string ;
    public DATE_OF_REGISTRATION: Date | null ;
    public FATHER_ID_NUMBER: string ;
    public FATHER_FORENAME: string ;
    public FATHER_SURNAME: string ;
    public FATHER_OTHER_NAME: string ;
    public FATHER_NATIONALITY: string ;
    public MOTHER_ID_NUMBER: string ;
    public MOTHER_FORENAME: string ;
    public MOTHER_SURNAME: string ;
    public MOTHER_OTHER_NAME: string ;
    public MOTHER_NATIONALITY: string ;
    public DATE_OF_ISSUE: Date | null ;
    public DATE_OF_COLLECTION: Date | null ;
    public MOTHER_AGE: string ;
    public MOTHER_MARITAL_STATUS: string ;
    public YEAR_OF_REGISTRATION: string ;
    public DATE_OF_DEATH: Date | null ;
    public PLACE_OF_DEATH: string ;
    public AGE_DAYS: string ;
    public AGE_MONTHS: string ;
    public AGE_YEARS: string ;
    public CODE_ICD10: string ;
    public CAUSE_OF_DEATH: string ;
    public TYPE_OF_RELATIONSHIP: string ;
    public ID_NUMBER_NEXT_OF_KIN: string ;
    public FORENAME_NEXT_OF_KIN: string ;
    public SURNAME_NEXT_OF_KIN: string ;
    public OTHER_NAME_NEXT_OF_KIN: string ;
    public NATIONALITY_NEXT_OF_KIN: string ;

    constructor(init?: Partial<BirthDeathRecord>) {
        Object.assign(this, init);
      }
  }