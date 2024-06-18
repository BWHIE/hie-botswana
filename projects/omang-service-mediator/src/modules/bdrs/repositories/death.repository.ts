import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { Pager } from 'src/utils/pager';
import { DeathRecord } from '../models/death-record';
import config from 'src/config';

@Injectable()
export class DeathRepository {
  private readonly _deathSelectColumns: string[] = [
    'DEATH_CERTIFICATE',
    'DISTRICT_OF_REGISTRATION',
    'DISTRICT_OF_DEATH_NAME',
    'DISTRICT_OF_DEATH',
    'ID_NUMBER',
    'REGISTRATION_NUMBER',
    'FORENAME',
    'SURNAME',
    'OTHER_NAME',
    'NATIONALITY',
    'OCCUPATION',
    'DATE_OF_DEATH',
    'SEX',
    'TOWN_VILL',
    'WARD_STREET',
    'PLACE_OF_DEATH',
    'DATE_OF_REGISTRATION',
    'AGE_DAYS',
    'AGE_MONTHS',
    'AGE_YEARS',
    'CODE_ICD10',
    'CAUSE_OF_DEATH',
    'DATE_OF_ISSUE',
    'YEAR_OF_REGISTRATION',
    'TYPE_OF_RELATIONSHIP',
    'ID_NUMBER_NEXT_OF_KIN',
    'FORENAME_NEXT_OF_KIN',
    'SURNAME_NEXT_OF_KIN',
    'OTHER_NAME_NEXT_OF_KIN',
    'NATIONALITY_NEXT_OF_KIN',
    'DATE_OF_COLLECTION',
  ];

  private readonly logger = new Logger(DeathRepository.name);
  private readonly viewName = config.get('BDRS_DEATH_VIEW');

  constructor(
    @InjectConnection('deathConnection')
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

  private getDeathFromRow(row: any): DeathRecord {
    const result = new DeathRecord();

    result.ID_NUMBER = row.ID_NUMBER?.toString() ?? null;
    result.ID_NUMBER_NEXT_OF_KIN =
      row.ID_NUMBER_NEXT_OF_KIN?.toString() ?? null;
    result.FORENAME = row.FORENAME?.toString() ?? null;
    result.SURNAME = row.SURNAME?.toString() ?? null;
    result.DATE_OF_DEATH =
      row.DATE_OF_DEATH !== null ? new Date(row.DATE_OF_DEATH) : null;
    result.AGE_DAYS = row.AGE_DAYS?.toString() ?? null;
    result.AGE_MONTHS = row.AGE_MONTHS?.toString() ?? null;
    result.AGE_YEARS = row.AGE_YEARS?.toString() ?? null;
    result.CAUSE_OF_DEATH = row.CAUSE_OF_DEATH?.toString() ?? null;
    result.CODE_ICD10 = row.CODE_ICD10?.toString() ?? null;
    result.DATE_OF_COLLECTION =
      row.DATE_OF_COLLECTION !== null ? new Date(row.DATE_OF_COLLECTION) : null;
    result.DATE_OF_ISSUE =
      row.DATE_OF_ISSUE !== null ? new Date(row.DATE_OF_ISSUE) : null;
    result.DATE_OF_REGISTRATION =
      row.DATE_OF_REGISTRATION !== null
        ? new Date(row.DATE_OF_REGISTRATION)
        : null;
    result.DEATH_CERTIFICATE = row.DEATH_CERTIFICATE?.toString() ?? null;
    result.DISTRICT_OF_DEATH = row.DISTRICT_OF_DEATH?.toString() ?? null;
    result.DISTRICT_OF_DEATH_NAME =
      row.DISTRICT_OF_DEATH_NAME?.toString() ?? null;
    result.DISTRICT_OF_REGISTRATION =
      row.DISTRICT_OF_REGISTRATION?.toString() ?? null;
    result.FORENAME_NEXT_OF_KIN = row.FORENAME_NEXT_OF_KIN?.toString() ?? null;
    result.NATIONALITY = row.NATIONALITY?.toString() ?? null;
    result.NATIONALITY_NEXT_OF_KIN =
      row.NATIONALITY_NEXT_OF_KIN?.toString() ?? null;
    result.OCCUPATION = row.OCCUPATION?.toString() ?? null;
    result.OTHER_NAME = row.OTHER_NAME?.toString() ?? null;
    result.PLACE_OF_DEATH = row.PLACE_OF_DEATH?.toString() ?? null;
    result.SEX = row.SEX?.toString() ?? null;
    result.TOWN_VILL = row.TOWN_VILL?.toString() ?? null;
    result.TYPE_OF_RELATIONSHIP = row.TYPE_OF_RELATIONSHIP?.toString() ?? null;
    result.WARD_STREET = row.WARD_STREET?.toString() ?? null;
    result.YEAR_OF_REGISTRATION = row.YEAR_OF_REGISTRATION?.toString() ?? null;

    return result;
  }

  async get(idNo: string): Promise<DeathRecord | null> {
    const query = `
        SELECT ${this._deathSelectColumns}
        FROM ${this.viewName}
        WHERE ROWNUM = 1 AND UPPER(ID_NUMBER) = UPPER(:id)
    `;
    const idParameter = idNo; // parameter to prevent SQL injection
    let result: DeathRecord | null = null;

    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [idParameter]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result = this.getDeathFromRow(row);
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  async getByLastName(lastName: string, pager: Pager): Promise<DeathRecord[]> {
    lastName += '%';
    const filter = 'UPPER(SURNAME) LIKE UPPER(:LastName)';
    const query = `
      SELECT *
      FROM (
        SELECT a.*, rownum r
        FROM (
          SELECT ${this._deathSelectColumns}
          FROM ${this.viewName}
          WHERE ${filter}
          ORDER BY ID_NUMBER
        ) a
        WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
      )
      WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
    `;

    const result: DeathRecord[] = [];

    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [lastName]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getDeathFromRow(row));
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
  ): Promise<DeathRecord[]> {
    firstName += '%';
    lastName += '%';
    const filter =
      'UPPER(FORENAME) LIKE UPPER(:firstName) AND UPPER(SURNAME) LIKE UPPER(:lastName)';
    const fParameter = firstName; // parameter to prevent SQL injection
    const lParameter = lastName;

    const query = `
        SELECT *
        FROM (
            SELECT a.*, rownum r
            FROM (
                SELECT ${this._deathSelectColumns}
                FROM ${this.viewName}
                WHERE ${filter}
                ORDER BY ID_NUMBER
            ) a
            WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
        )
        WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
    `;

    const result: DeathRecord[] = [];

    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [fParameter, lParameter]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getDeathFromRow(row));
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
  ): Promise<DeathRecord[]> {
    firstName += '%';
    middleName += '%';
    lastName += '%';
    const filter =
      'UPPER(FORENAME) LIKE UPPER(:firstName) AND UPPER(OTHER_NAME) LIKE UPPER(:middleName) AND UPPER(SURNAME) LIKE UPPER(:lastName)';
    const fParameter = firstName; // parameter to prevent SQL injection
    const oParameter = middleName;
    const lParameter = lastName;

    const query = `
        SELECT *
        FROM (
            SELECT a.*, rownum r
            FROM (
                SELECT ${this._deathSelectColumns}
                FROM ${this.viewName}
                WHERE ${filter}
                ORDER BY ID_NUMBER
            ) a
            WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
        )
        WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
    `;

    const result: DeathRecord[] = [];

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
          result.push(this.getDeathFromRow(row));
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  async getMany(ids: string[], pager: Pager): Promise<DeathRecord[]> {
    const parameters: any = {};
    ids.forEach((id, index) => {
      parameters[`ID${index}`] = id;
    });

    const filter = ids.map((_, i) => `UPPER(ID_NUMBER) = :ID${i}`).join(' OR ');

    const query = `
        SELECT *
        FROM (
            SELECT a.*, rownum r
            FROM (
                SELECT *
                FROM ${this.viewName}
                WHERE ${filter}
                ORDER BY ID_NUMBER
            ) a
            WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
        )
        WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
    `;

    const result: DeathRecord[] = [];

    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, parameters);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getDeathFromRow(row));
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  async findDeathsByDate(
    startDate: Date | null,
    endDate: Date | null,
    pager: Pager,
  ): Promise<DeathRecord[]> {
    const filter = `DATE_OF_DEATH IS NOT NULL 
                    AND DATE_OF_DEATH >= :startDate 
                    AND DATE_OF_DEATH <= :endDate`;
    const sParameter = startDate ? startDate : null;

    const eParameter = endDate ? endDate : null;

    const query = `
        SELECT *
        FROM (
            SELECT a.*, rownum r
            FROM (
                SELECT ${this._deathSelectColumns}
                FROM ${this.viewName}
                WHERE ${filter}
                ORDER BY ID_NUMBER
            ) a
            WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
        )
        WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
    `;

    const result: DeathRecord[] = [];

    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      const rows = await queryRunner.query(query, [sParameter, eParameter]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          result.push(this.getDeathFromRow(row));
        }
      }
    } finally {
      await queryRunner.release();
    }

    return result;
  }
}
