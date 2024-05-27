export class ImmigrationRecord {
  PASSPORT_NO: string;
  PASSP_ISSUE_DATE: Date | null;
  PASSP_EXPIRY_DATE: Date | null;
  SURNAME: string;
  FIRST_NAME: string;
  MIDDLE_NAME: string;
  CITIZENSHIP: string;
  CITIZENSHIP_NAME: string;
  GENDER: string;
  BIRTH_DATE: Date | null;
  BIRTH_COUNTRY_CODE: string;
  BIRTH_COUNTRY_NAME: string;
  MARITAL_STATUS_CODE: string;
  MARITAL_STATUS_NAME: string;
  DATE_OF_ENTRY: Date | null;
  ENTRY_PLACE_CODE: string;
  ENTRY_PLACE_NAME: string;
  SPOUSE_FIRST_NAME: string;
  SPOUSE_SURNAME: string;

  constructor(init?: Partial<ImmigrationRecord>) {
    Object.assign(this, init);
  }
}
