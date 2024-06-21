import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Pager } from 'src/utils/pager';
import { Connection } from 'typeorm';
import { Omang } from '../models/omang';

@Injectable()
export class OmangRepository {
  private readonly logger = new Logger(OmangRepository.name);
  private readonly viewName = 'OMANG_CITIZEN'; //config.get('CITIZEN_VIEW');

  constructor(
    @InjectConnection('omangConnection')
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
        this.logger.log(`Omang: ${this.viewName} is online`);
        isOnline = true;
      } else {
        this.logger.error(`Omang: ${this.viewName} is offline`);
      }
    } catch (error) {
      this.logger.error(error);
    }

    return isOnline;
  }

  private getOmangFromReader(reader: any): Omang {
    const result: Omang = new Omang();
    {
      result.IdNo = reader['ID_NO']?.toString() ?? null;
      result.FirstName = reader['FIRST_NME']?.toString() ?? null;
      result.Surname = reader['SURNME']?.toString() ?? null;
      result.BirthDate =
        reader['BIRTH_DTE'] !== null ? new Date(reader['BIRTH_DTE']) : null;
      result.BirthDateUnknown = reader['BIRTH_DTE_UNKNOWN']?.toString();
      result.BirthPlace = reader['BIRTH_PLACE_NME']?.toString() ?? null;
      result.DistrictName = reader['DISTRICT_NME']?.toString() ?? null;
      result.PersonStatus = reader['PERSON_STATUS']?.toString() ?? null;
      result.DistrictCode = reader['DISTRICT_CDE']?.toString() ?? null;
      result.Sex = reader['SEX']?.toString() ?? null;
      result.SpouseName = reader['SPOUSE_NME']?.toString() ?? null;
      result.CitizenStatusCode =
        reader['CITIZEN_STATUS_CDE']?.toString() ?? null;
      result.CitizenStatusDate =
        reader['CITIZEN_STATUS_DTE'] !== null
          ? new Date(reader['CITIZEN_STATUS_DTE'])
          : null;
      result.DeathCertificateNo = reader['DEATH_CERT_NO']?.toString() ?? null;
      result.DeceasedDate =
        reader['DECEASED_DTE'] !== null
          ? new Date(reader['DECEASED_DTE'])
          : null;
      result.DeceasedDateUnknown =
        reader['DECEASED_DTE_UNKNOWN']?.toString() ?? null;
      result.MaritalStatusCode =
        reader['MARITAL_STATUS_CDE']?.toString() ?? null;
      result.MaritalStatusDescription =
        reader['MARITAL_STATUS_DESCR']?.toString() ?? null;
      result.ChangeDate =
        reader['CHANGE_DTE'] !== null ? new Date(reader['CHANGE_DTE']) : null;
      result.ExpiryDate =
        reader['EXPIRY_DTE'] !== null ? new Date(reader['EXPIRY_DTE']) : null;
      result.PostalAddress = reader['POSTAL_ADDR']?.toString() ?? null;
      result.ResidentialAddress =
        reader['RESIDENTIAL_ADDR']?.toString() ?? null;
    }

    return result;
  }

  async get(IDNO: string): Promise<Omang | null> {
    let result: Omang = null;
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT 
                ID_NO,
                FIRST_NME,
                SURNME,
                BIRTH_DTE,
                BIRTH_DTE_UNKNOWN,
                BIRTH_PLACE_NME,
                DISTRICT_NME,
                PERSON_STATUS,
                DISTRICT_CDE,
                SEX,
                SPOUSE_NME,
                CITIZEN_STATUS_CDE,
                CITIZEN_STATUS_DTE,
                DEATH_CERT_NO,
                DECEASED_DTE,
                DECEASED_DTE_UNKNOWN,
                MARITAL_STATUS_CDE,
                MARITAL_STATUS_DESCR,
                CHANGE_DTE,
                EXPIRY_DTE,
                POSTAL_ADDR,
                RESIDENTIAL_ADDR
            FROM ${this.viewName}
            WHERE ROWNUM = 1
            AND UPPER(ID_NO) = UPPER(:IDNO)
        `;

    const idParameter = IDNO;

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [idParameter]);

      if (rows && rows.length > 0) {
        result = this.getOmangFromReader(rows);
      }

      return result;
    } finally {
      await queryRunner.release();
    }
  }

  async getByLastName(lastName: string, pager: Pager): Promise<Omang[]> {
    // First prepare the database query
    lastName += '%';
    const filter = 'UPPER(SURNME) LIKE UPPER(:lastName)';
    const lParameter = lastName;

    const result: Omang[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT 
                        ID_NO,
                        FIRST_NME,
                        SURNME,
                        BIRTH_DTE,
                        BIRTH_DTE_UNKNOWN,
                        BIRTH_PLACE_NME,
                        DISTRICT_NME,
                        PERSON_STATUS,
                        DISTRICT_CDE,
                        SEX,
                        SPOUSE_NME,
                        CITIZEN_STATUS_CDE,
                        CITIZEN_STATUS_DTE,
                        DEATH_CERT_NO,
                        DECEASED_DTE,
                        DECEASED_DTE_UNKNOWN,
                        MARITAL_STATUS_CDE,
                        MARITAL_STATUS_DESCR,
                        CHANGE_DTE,
                        EXPIRY_DTE,
                        POSTAL_ADDR,
                        RESIDENTIAL_ADDR
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY ID_NO
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
          result.push(this.getOmangFromReader(row));
        }
      }

      return result;
    } finally {
      await queryRunner.release();
    }
  }

  async getByName(
    firstName: string,
    lastName: string,
    pager: Pager,
  ): Promise<Omang[]> {
    // First prepare the database query
    // Adding wildcard operator for less restrictive searches
    firstName += '%';
    lastName += '%';
    const filter =
      'UPPER(FIRST_NME) LIKE UPPER(:firstName) AND UPPER(SURNME) LIKE UPPER(:lastName)';
    const fParameter = firstName; // parameter to prevent SQL injection
    const lParameter = lastName;

    const result: Omang[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT 
                        ID_NO,
                        FIRST_NME,
                        SURNME,
                        BIRTH_DTE,
                        BIRTH_DTE_UNKNOWN,
                        BIRTH_PLACE_NME,
                        DISTRICT_NME,
                        PERSON_STATUS,
                        DISTRICT_CDE,
                        SEX,
                        SPOUSE_NME,
                        CITIZEN_STATUS_CDE,
                        CITIZEN_STATUS_DTE,
                        DEATH_CERT_NO,
                        DECEASED_DTE,
                        DECEASED_DTE_UNKNOWN,
                        MARITAL_STATUS_CDE,
                        MARITAL_STATUS_DESCR,
                        CHANGE_DTE,
                        EXPIRY_DTE,
                        POSTAL_ADDR,
                        RESIDENTIAL_ADDR
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY ID_NO
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
          result.push(this.getOmangFromReader(row));
        }
      }

      return result;
    } finally {
      await queryRunner.release();
    }
  }

  async getByDemographicData(
    firstName: string,
    lastName: string,
    gender: string,
    birthDate: string,
    pager: Pager,
  ): Promise<Omang[]> {
    // Prepare the SQL query dynamically based on input
    let conditions = [];
    let parameters = {};

    if (firstName) {
      conditions.push('UPPER(FIRST_NME) LIKE UPPER(:firstName)');
      parameters['firstName'] = firstName + '%';
    }
    if (lastName) {
      conditions.push('UPPER(SURNME) LIKE UPPER(:lastName)');
      parameters['lastName'] = lastName + '%';
    }
    if (gender) {
      conditions.push('UPPER(SEX) LIKE UPPER(:gender)');
      parameters['gender'] = (gender === 'male' ? 'M' : 'F') + '%';
    }
    if (birthDate) {
      conditions.push('BIRTH_DTE LIKE :birthDate');
      parameters['birthDate'] = birthDate + '%';
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1'; // if no conditions, select all
    const query = `
      SELECT *
      FROM (
          SELECT a.*, rownum r
          FROM (
              SELECT 
                  ID_NO,
                  FIRST_NME,
                  SURNME,
                  BIRTH_DTE,
                  BIRTH_DTE_UNKNOWN,
                  BIRTH_PLACE_NME,
                  DISTRICT_NME,
                  PERSON_STATUS,
                  DISTRICT_CDE,
                  SEX,
                  SPOUSE_NME,
                  CITIZEN_STATUS_CDE,
                  CITIZEN_STATUS_DTE,
                  DEATH_CERT_NO,
                  DECEASED_DTE,
                  DECEASED_DTE_UNKNOWN,
                  MARITAL_STATUS_CDE,
                  MARITAL_STATUS_DESCR,
                  CHANGE_DTE,
                  EXPIRY_DTE,
                  POSTAL_ADDR,
                  RESIDENTIAL_ADDR
              FROM ${this.viewName}
              WHERE ${whereClause}
              ORDER BY ID_NO
          ) a
          WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
      )
      WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
    `;

    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, Object.values(parameters));
      await queryRunner.release();

      return rows.map((row) => this.getOmangFromReader(row));
    } catch (error) {
      await queryRunner.release();
      throw error; // Rethrow to maintain stack trace
    }
  }

  async getMany(IDNO: string[], pager: Pager): Promise<Omang[]> {
    // const parameters = IDNO.map((s, i) => `$${i + 1}`); // create parameter array
    // const parameterStr = parameters.join(', '); // Get parameter string with comma delimiter
    // const filter = `UPPER(ID_NO) IN (${parameterStr})`;

    const parameters: any = {};
    IDNO.forEach((id, index) => {
      parameters[`ID${index}`] = id;
    });

    const filter = IDNO.map((_, i) => `UPPER(ID_NO) = :ID${i}`).join(' OR ');

    // Creating the parameters
    const result: Omang[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT
                        ID_NO,
                        FIRST_NME,
                        SURNME,
                        BIRTH_DTE,
                        BIRTH_DTE_UNKNOWN,
                        BIRTH_PLACE_NME,
                        DISTRICT_NME,
                        PERSON_STATUS,
                        DISTRICT_CDE,
                        SEX,
                        SPOUSE_NME,
                        CITIZEN_STATUS_CDE,
                        CITIZEN_STATUS_DTE,
                        DEATH_CERT_NO,
                        DECEASED_DTE,
                        DECEASED_DTE_UNKNOWN,
                        MARITAL_STATUS_CDE,
                        MARITAL_STATUS_DESCR,
                        CHANGE_DTE,
                        EXPIRY_DTE,
                        POSTAL_ADDR,
                        RESIDENTIAL_ADDR
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY ID_NO
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
          result.push(this.getOmangFromReader(row));
        }
      }

      return result;
    } finally {
      await queryRunner.release();
    }
  }

  async getDeceased(
    startDate: Date | null,
    endDate: Date | null,
    pager: Pager,
  ): Promise<Omang[]> {
    const filter = `DECEASED_DTE IS NOT NULL 
                        AND DECEASED_DTE >= :startDate
                        AND DECEASED_DTE <= :endDate`;

    const sParameter = startDate ? startDate : null;
    const eParameter = endDate ? endDate : null;

    const result: Omang[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT
                        ID_NO,
                        FIRST_NME,
                        SURNME,
                        BIRTH_DTE,
                        BIRTH_DTE_UNKNOWN,
                        BIRTH_PLACE_NME,
                        DISTRICT_NME,
                        PERSON_STATUS,
                        DISTRICT_CDE,
                        SEX,
                        SPOUSE_NME,
                        CITIZEN_STATUS_CDE,
                        CITIZEN_STATUS_DTE,
                        DEATH_CERT_NO,
                        DECEASED_DTE,
                        DECEASED_DTE_UNKNOWN,
                        MARITAL_STATUS_CDE,
                        MARITAL_STATUS_DESCR,
                        CHANGE_DTE,
                        EXPIRY_DTE,
                        POSTAL_ADDR,
                        RESIDENTIAL_ADDR
                    FROM ${this.viewName}
                    WHERE ${filter}
                    ORDER BY ID_NO
                ) a
                WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
            )
            WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
        `;

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [sParameter, eParameter]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getOmangFromReader(row));
        }
      }

      return result;
    } finally {
      await queryRunner.release();
    }
  }

  async getChanged(
    startDate: Date | null,
    endDate: Date | null,
    pager: Pager,
  ): Promise<Omang[]> {
    const filter = `(
            (DECEASED_DTE IS NOT NULL 
            AND DECEASED_DTE >= :startDateD
            AND DECEASED_DTE <= :endDateD) 
            OR 
            (CHANGE_DTE IS NOT NULL AND CHANGE_DTE >= :startDateC
            AND CHANGE_DTE <= :endDateC) 
        )`;

    const sParameterD = startDate ? startDate : null;
    const eParameterD = endDate ? endDate : null;
    const sParameterC = startDate ? startDate : null;
    const eParameterC = endDate ? endDate : null;

    const result: Omang[] = [];
    const queryRunner = this.connection.createQueryRunner();

    const query = `
            SELECT *
            FROM (
                SELECT a.*, rownum r
                FROM (
                    SELECT 
                        ID_NO,
                        FIRST_NME,
                        SURNME,
                        BIRTH_DTE,
                        BIRTH_DTE_UNKNOWN,
                        BIRTH_PLACE_NME,
                        DISTRICT_NME,
                        PERSON_STATUS,
                        DISTRICT_CDE,
                        SEX,
                        SPOUSE_NME,
                        CITIZEN_STATUS_CDE,
                        CITIZEN_STATUS_DTE,
                        DEATH_CERT_NO,
                        DECEASED_DTE,
                        DECEASED_DTE_UNKNOWN,
                        MARITAL_STATUS_CDE,
                        MARITAL_STATUS_DESCR,
                        CHANGE_DTE,
                        EXPIRY_DTE,
                        POSTAL_ADDR,
                        RESIDENTIAL_ADDR
                    FROM ${this.viewName}
                    WHERE ${filter} 
                    ORDER BY ID_NO
                ) a
                WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
            )
            WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
        `;

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [
        sParameterD,
        eParameterD,
        sParameterC,
        eParameterC,
      ]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getOmangFromReader(row));
        }
      }

      return result;
    } finally {
      await queryRunner.release();
    }
  }
}
