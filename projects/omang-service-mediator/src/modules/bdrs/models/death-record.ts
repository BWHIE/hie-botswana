export class DeathRecord {
  ID_NUMBER: string;
  DEATH_CERTIFICATE: string;
  DISTRICT_OF_REGISTRATION: string;
  DISTRICT_OF_DEATH: string;
  DISTRICT_OF_DEATH_NAME: string;
  REGISTRATION_NUMBER: string;
  FORENAME: string;
  SURNAME: string;
  OTHER_NAME: string;
  NATIONALITY: string;
  OCCUPATION: string;
  DATE_OF_DEATH: Date | null;
  SEX: string;
  TOWN_VILL: string;
  WARD_STREET: string;
  PLACE_OF_DEATH: string;
  DATE_OF_REGISTRATION: Date | null;
  AGE_DAYS: string;
  AGE_MONTHS: string;
  AGE_YEARS: string;
  CODE_ICD10: string;
  CAUSE_OF_DEATH: string;
  DATE_OF_ISSUE: Date | null;
  YEAR_OF_REGISTRATION: string;
  TYPE_OF_RELATIONSHIP: string;
  ID_NUMBER_NEXT_OF_KIN: string;
  MOTHER_NATIONALITY: string;
  FORENAME_NEXT_OF_KIN: string;
  SURNAME_NEXT_OF_KIN: string;
  OTHER_NAME_NEXT_OF_KIN: string;
  NATIONALITY_NEXT_OF_KIN: string;
  DATE_OF_COLLECTION: Date | null;

  constructor(init?: Partial<DeathRecord>) {
    Object.assign(this, init);
  }
}
