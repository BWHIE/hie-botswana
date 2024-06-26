export class BirthRecord {
  ID_NUMBER: string;
  BIRTH_CERTIFICATE: string;
  BIRTH_CERTIFICATE_OLD: string;
  DISTRICT_OF_BIRTH_NAME: string;
  DISTRICT_OF_BIRTH: string;
  TYPE_OF_BIRTH: string;
  REGISTRATION_NUMBER: string;
  FORENAME: string;
  SURNAME: string;
  OTHER_NAME: string;
  DATE_OF_BIRTH: Date | null;
  SEX: string;
  TOWN_VILL: string;
  WARD_STREET: string;
  DATE_OF_REGISTRATION: Date | null;
  FATHER_ID_NUMBER: string;
  FATHER_FORENAME: string;
  FATHER_SURNAME: string;
  FATHER_OTHER_NAME: string;
  FATHER_NATIONALITY: string;
  MOTHER_ID_NUMBER: string;
  MOTHER_FORENAME: string;
  MOTHER_SURNAME: string;
  MOTHER_OTHER_NAME: string;
  MOTHER_NATIONALITY: string;
  DATE_OF_ISSUE: Date | null;
  DATE_OF_COLLECTION: Date | null;
  MOTHER_AGE: string;
  MOTHER_MARITAL_STATUS: string;
  YEAR_OF_REGISTRATION: string;

  constructor(init?: Partial<BirthRecord>) {
    Object.assign(this, init);
  }
}
