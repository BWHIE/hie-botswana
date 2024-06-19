import { ImmigrationRecord } from '../models/immigration-record';
import { Pager } from 'src/utils/pager';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { config } from 'src/config';

@Injectable()
export class ImmigrationRepository {
  private readonly logger = new Logger(ImmigrationRepository.name);
  private readonly viewName = config.get('IMMIGRATION_VIEW');

  constructor(
    @InjectConnection('immigrationConnection')
    private readonly connection: Connection,
  ) {}

  async checkStatus(): Promise<boolean> {
    try {
    } catch (error) {
      this.logger.error(`Error checking status: ${error.message}`);
      return false;
    }

    const query = `SELECT 1 FROM ${this.viewName} WHERE ROWNUM = 1`;

    let isOnline = false;

    try {
      const result = await this.connection.query(query);

      if (result.length > 0) {
        this.logger.log(`BDRS: ${this.viewName} is online`);
        isOnline = true;
      } else {
        this.logger.error(`BDRS: ${this.viewName} is offline`);
      }
    } catch (error) {
      this.logger.error(error);
    }

    return isOnline;
  }

  private getQueryColumns(): string {
    return `
            PASSPORT_NO,
            PASSP_ISSUE_DATE,
            PASSP_EXPIRY_DATE,
            SURNAME,
            FIRST_NAME,
            MIDDLE_NAME,
            CITIZENSHIP,
            CITIZENSHIP_NAME,
            GENDER,
            BIRTH_DATE,
            BIRTH_COUNTRY_CODE,
            BIRTH_COUNTRY_NAME,
            MARITAL_STATUS_CODE,
            MARITAL_STATUS_NAME,
            DATE_OF_ENTRY,
            ENTRY_PLACE_CODE,
            ENTRY_PLACE_NAME,
            SPOUSE_FIRST_NAME,
            SPOUSE_SURNAME
        `;
  }

  private getImmigrationRecordFromRow(row: any): ImmigrationRecord {
    const result: ImmigrationRecord = new ImmigrationRecord();

    result.PASSPORT_NO = row.PASSPORT_NO ? row.PASSPORT_NO.toString() : null;
    result.PASSP_ISSUE_DATE = row.PASSP_ISSUE_DATE
      ? new Date(row.PASSP_ISSUE_DATE)
      : null;
    result.PASSP_EXPIRY_DATE = row.PASSP_EXPIRY_DATE
      ? new Date(row.PASSP_EXPIRY_DATE)
      : null;
    result.SURNAME = row.SURNAME ? row.SURNAME.toString() : null;
    result.FIRST_NAME = row.FIRST_NAME ? row.FIRST_NAME.toString() : null;
    result.MIDDLE_NAME = row.MIDDLE_NAME ? row.MIDDLE_NAME.toString() : null;
    result.CITIZENSHIP = row.CITIZENSHIP ? row.CITIZENSHIP.toString() : null;
    result.CITIZENSHIP_NAME = row.CITIZENSHIP_NAME
      ? row.CITIZENSHIP_NAME.toString()
      : null;
    result.GENDER = row.GENDER ? row.GENDER.toString() : null;
    result.BIRTH_DATE = row.BIRTH_DATE ? new Date(row.BIRTH_DATE) : null;
    result.BIRTH_COUNTRY_CODE = row.BIRTH_COUNTRY_CODE
      ? row.BIRTH_COUNTRY_CODE.toString()
      : null;
    result.BIRTH_COUNTRY_NAME = row.BIRTH_COUNTRY_NAME
      ? row.BIRTH_COUNTRY_NAME.toString()
      : null;
    result.MARITAL_STATUS_CODE = row.MARITAL_STATUS_CODE
      ? row.MARITAL_STATUS_CODE.toString()
      : null;
    result.MARITAL_STATUS_NAME = row.MARITAL_STATUS_NAME
      ? row.MARITAL_STATUS_NAME.toString()
      : null;
    result.DATE_OF_ENTRY = row.DATE_OF_ENTRY
      ? new Date(row.DATE_OF_ENTRY)
      : null;
    result.ENTRY_PLACE_CODE = row.ENTRY_PLACE_CODE
      ? row.ENTRY_PLACE_CODE.toString()
      : null;
    result.ENTRY_PLACE_NAME = row.ENTRY_PLACE_NAME
      ? row.ENTRY_PLACE_NAME.toString()
      : null;
    result.SPOUSE_FIRST_NAME = row.SPOUSE_FIRST_NAME
      ? row.SPOUSE_FIRST_NAME.toString()
      : null;
    result.SPOUSE_SURNAME = row.SPOUSE_SURNAME
      ? row.SPOUSE_SURNAME.toString()
      : null;

    return result;
  }

  async get(passportNo: string): Promise<ImmigrationRecord> {
    let result: ImmigrationRecord = null;
    const queryRunner = this.connection.createQueryRunner();

    const query = `SELECT DISTINCT ${this.getQueryColumns()} FROM ${this.viewName} WHERE ROWNUM=1 AND UPPER(PASSPORT_NO) = UPPER(:passportNo)`;
    const idParameter = passportNo;

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [idParameter]);

      if (rows && rows.length > 0) {
        result = this.getImmigrationRecordFromRow(rows);
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  async getByLastName(
    lastName: string,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    // First prepare the database query
    lastName += '%';
    const filter = 'UPPER(SURNAME) LIKE UPPER(:lastName)';
    const lParameter = lastName;

    const result: ImmigrationRecord[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT DISTINCT ${this.getQueryColumns()}
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY PASSPORT_NO
                ) a
                WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
            )
            WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
        `;

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [lParameter]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getImmigrationRecordFromRow(row));
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  async getByName(
    firstName: string,
    lastName: string,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    const filter =
      'UPPER(FIRST_NAME) LIKE UPPER(:firstName) AND UPPER(SURNAME) LIKE UPPER(:lastName)';
    const fParameter = firstName + '%';
    const lParameter = lastName + '%';

    const result: ImmigrationRecord[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT DISTINCT ${this.getQueryColumns()}
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY PASSPORT_NO
                ) a
                WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
            )
            WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
        `;

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [fParameter, lParameter]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getImmigrationRecordFromRow(row));
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  async getByNameWithMiddleName(
    firstName: string,
    middleName: string,
    lastName: string,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    // First prepare the database query
    const filter =
      'UPPER(FIRST_NAME) LIKE UPPER(:firstName) AND UPPER(MIDDLE_NAME) LIKE UPPER(:middleName) AND UPPER(SURNAME) LIKE UPPER(:lastName)';
    const fParameter = firstName + '%';
    const oParameter = middleName + '%';
    const lParameter = lastName + '%';

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT DISTINCT ${this.getQueryColumns()}
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY PASSPORT_NO
                ) a
                WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
            )
            WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
        `;

    const result: ImmigrationRecord[] = [];
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [
        fParameter,
        oParameter,
        lParameter,
      ]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getImmigrationRecordFromRow(row));
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  async getByDemographicData(
    firstName: string,
    lastName: string,
    gender: string,
    birthDate: string,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    const filter =
      'UPPER(FIRST_NAME) LIKE UPPER(:firstName) AND UPPER(SURNAME) LIKE UPPER(:lastName) AND UPPER(GENDER) LIKE UPPER(:gender) AND BIRTH_DATE LIKE :birthDate';
    const fParameter = firstName + '%';
    const lParameter = lastName + '%';
    const gParameter = gender + '%';
    const bParameter = birthDate + '%';

    const result: ImmigrationRecord[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT DISTINCT ${this.getQueryColumns()}
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY PASSPORT_NO
                ) a
                WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
            )
            WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
        `;

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [fParameter, lParameter, gParameter, bParameter]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getImmigrationRecordFromRow(row));
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }


  async getMany(
    passportNo: string[],
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    // const parameters = passportNo.map((s, i) =>  `$${i + 1}`); // Create parameter array
    // const parameterStr = parameters.join(", "); // Get parameter string with comma delimiter
    // const filter = `UPPER(PASSPORT_NO) IN (${parameterStr})`;

    const parameters: any = {};
    passportNo.forEach((id, index) => {
      parameters[`ID${index}`] = id;
    });

    const filter = passportNo
      .map((_, i) => `UPPER(PASSPORT_NO) = :ID${i}`)
      .join(' OR ');

    // // Creating the parameters
    // const valueAr = passportNo.map((value, index) => ({
    //     [`ID${index}`]: value.toUpperCase()
    // }));

    const result: ImmigrationRecord[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT DISTINCT ${this.getQueryColumns()}
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY PASSPORT_NO
                ) a
                WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
            )
            WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
        `;

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, parameters);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getImmigrationRecordFromRow(row));
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  async findByBirthDate(
    startDate: Date | null,
    endDate: Date | null,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    // First prepare the database query
    const filter = `BIRTH_DATE IS NOT NULL 
                        AND BIRTH_DATE >= :startDate
                        AND BIRTH_DATE <= :endDate`;

    const result: ImmigrationRecord[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT DISTINCT ${this.getQueryColumns()}
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY PASSPORT_NO
                ) a
                WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
            )
            WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
        `;

    const sParameter = startDate ? startDate : null;
    const eParameter = endDate ? endDate : null;

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [sParameter, eParameter]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getImmigrationRecordFromRow(row));
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  async findByEntryDate(
    startDate: Date | null,
    endDate: Date | null,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    const filter = `DATE_OF_ENTRY IS NOT NULL 
                        AND DATE_OF_ENTRY >= :startDate
                        AND DATE_OF_ENTRY <= :endDate`;

    const result: ImmigrationRecord[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT DISTINCT ${this.getQueryColumns()}
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY PASSPORT_NO
                ) a
                WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
            )
            WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
        `;

    const sParameter = startDate ? startDate : null;
    const eParameter = endDate ? endDate : null;

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [sParameter, eParameter]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getImmigrationRecordFromRow(row));
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  async findByPassportExpiryDate(
    startDate: Date | null,
    endDate: Date | null,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    const filter = `PASSP_EXPIRY_DATE IS NOT NULL 
                        AND PASSP_EXPIRY_DATE >= :startDate
                        AND PASSP_EXPIRY_DATE <= :endDate`;

    const result: ImmigrationRecord[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT DISTINCT ${this.getQueryColumns()}
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY PASSPORT_NO
                ) a
                WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
            )
            WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
        `;

    const sParameter = startDate ? startDate : null;
    const eParameter = endDate ? endDate : null;

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [sParameter, eParameter]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getImmigrationRecordFromRow(row));
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  async findBySex(sex: string, pager: Pager): Promise<ImmigrationRecord[]> {
    // sex = sex.substring(0, 1).toUpperCase(); // Get the first letter of the input and convert to uppercase
    const filter = `UPPER(GENDER) = UPPER(:sex)`;
    const sParameter = sex;

    const result: ImmigrationRecord[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT DISTINCT ${this.getQueryColumns()}
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY PASSPORT_NO
                ) a
                WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
            )
            WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
        `;

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [sParameter]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getImmigrationRecordFromRow(row));
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  async findByCountry(
    country: string,
    pager: Pager,
  ): Promise<ImmigrationRecord[]> {
    country += '%';
    const filter = `UPPER(CITIZENSHIP_NAME) LIKE UPPER(:country)`;
    const cParameter = country;

    const result: ImmigrationRecord[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT DISTINCT ${this.getQueryColumns()}
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY PASSPORT_NO
                ) a
                WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
            )
            WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
        `;

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [cParameter]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getImmigrationRecordFromRow(row));
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }
}
