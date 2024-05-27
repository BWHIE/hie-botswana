import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { DeathRecord } from '../models/death-record';
import { Pager } from '../models/omang';
import { BirthRecord } from '../models/birth-record';
import { BirthDeathRecord } from '../models/birthdeath-record';

@Injectable()
export class DeathRepository  {

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
  private readonly viewName = 'V_DEATH';

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
  
    result.ID_NUMBER =  row.ID_NUMBER?.toString() ?? null;
    result.ID_NUMBER_NEXT_OF_KIN=  row.ID_NUMBER_NEXT_OF_KIN?.toString() ?? null;
    result.FORENAME= row.FORENAME?.toString() ?? null;
    result.SURNAME= row.SURNAME?.toString() ?? null;
    result.DATE_OF_DEATH= row.DATE_OF_DEATH !== null ? new Date(row.DATE_OF_DEATH) : null;
    result.AGE_DAYS= row.AGE_DAYS?.toString() ?? null;
    result.AGE_MONTHS= row.AGE_MONTHS?.toString() ?? null;
    result.AGE_YEARS= row.AGE_YEARS?.toString() ?? null;
    result.CAUSE_OF_DEATH= row.CAUSE_OF_DEATH?.toString() ?? null;
    result.CODE_ICD10= row.CODE_ICD10?.toString() ?? null;
    result.DATE_OF_COLLECTION= row.DATE_OF_COLLECTION !== null ? new Date(row.DATE_OF_COLLECTION ) :null;
    result.DATE_OF_ISSUE= row.DATE_OF_ISSUE !== null ? new Date(row.DATE_OF_ISSUE) : null;
    result.DATE_OF_REGISTRATION= row.DATE_OF_REGISTRATION !== null ? new Date(row.DATE_OF_REGISTRATION) :null;
    result.DEATH_CERTIFICATE= row.DEATH_CERTIFICATE?.toString() ?? null;
    result.DISTRICT_OF_DEATH= row.DISTRICT_OF_DEATH?.toString() ?? null;
    result.DISTRICT_OF_DEATH_NAME= row.DISTRICT_OF_DEATH_NAME?.toString() ?? null;
    result.DISTRICT_OF_REGISTRATION= row.DISTRICT_OF_REGISTRATION?.toString() ?? null;
    result.FORENAME_NEXT_OF_KIN= row.FORENAME_NEXT_OF_KIN?.toString() ?? null;
    result.NATIONALITY= row.NATIONALITY?.toString() ?? null;
    result.NATIONALITY_NEXT_OF_KIN= row.NATIONALITY_NEXT_OF_KIN?.toString() ?? null;
    result.OCCUPATION= row.OCCUPATION?.toString() ?? null;
    result.OTHER_NAME= row.OTHER_NAME?.toString() ?? null;
    result.PLACE_OF_DEATH= row.PLACE_OF_DEATH?.toString() ?? null;
    result.SEX= row.SEX?.toString() ?? null;
    result.TOWN_VILL= row.TOWN_VILL?.toString() ?? null;
    result.TYPE_OF_RELATIONSHIP= row.TYPE_OF_RELATIONSHIP?.toString() ?? null;
    result.WARD_STREET= row.WARD_STREET?.toString() ?? null;
    result.YEAR_OF_REGISTRATION= row.YEAR_OF_REGISTRATION?.toString() ?? null;


    return result;
  }

  async  get(idNo: string): Promise<DeathRecord | null> {
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
          for (const row of rows){
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

  async getByName(firstName: string, lastName: string, pager: Pager): Promise<DeathRecord[]> {
    firstName += '%';
    lastName += '%';
    const filter = 'UPPER(FORENAME) LIKE UPPER(:firstName) AND UPPER(SURNAME) LIKE UPPER(:lastName)';
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

  async getByNameWithMiddleName(firstName: string, middleName: string, lastName: string, pager: Pager): Promise<DeathRecord[]> {
    firstName += '%';
    middleName += '%';
    lastName += '%';
    const filter = 'UPPER(FORENAME) LIKE UPPER(:firstName) AND UPPER(OTHER_NAME) LIKE UPPER(:middleName) AND UPPER(SURNAME) LIKE UPPER(:lastName)';
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
        const rows = await queryRunner.query(query, [fParameter, oParameter, lParameter]);

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
    
    const parameters : any = {};
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

  async findDeathsByDate(startDate: Date | null, endDate: Date | null, pager: Pager): Promise<DeathRecord[]> {

    const filter = `DATE_OF_DEATH IS NOT NULL 
                    AND DATE_OF_DEATH >= :startDate 
                    AND DATE_OF_DEATH <= :endDate`;
    const sParameter = startDate ? startDate : null;
  

    const eParameter =  endDate ? endDate : null;

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

@Injectable()
export class BirthRepository  {

    private readonly _deathSelectColumns: string[] = [
        'DEATH_CERTIFICATE',
        'DISTRICT_OF_DEATH_NAME',
        'DISTRICT_OF_DEATH',
        'OCCUPATION',
        'DATE_OF_DEATH',
        'PLACE_OF_DEATH',
        'AGE_DAYS',
        'AGE_MONTHS',
        'AGE_YEARS',
        'CODE_ICD10',
        'CAUSE_OF_DEATH',
        'TYPE_OF_RELATIONSHIP',
        'ID_NUMBER_NEXT_OF_KIN',
        'FORENAME_NEXT_OF_KIN',
        'SURNAME_NEXT_OF_KIN',
        'OTHER_NAME_NEXT_OF_KIN',
        'NATIONALITY_NEXT_OF_KIN'
    ];
    
    private readonly _birthSelectColumns: string[] = [
        'BIRTH_CERTIFICATE',
        'BIRTH_CERTIFICATE_OLD',
        'DISTRICT_OF_REGISTRATION',
        'DISTRICT_OF_BIRTH_NAME',
        'DISTRICT_OF_BIRTH',
        'TYPE_OF_BIRTH',
        'ID_NUMBER',
        'REGISTRATION_NUMBER',
        'FORENAME',
        'SURNAME',
        'OTHER_NAME',
        'DATE_OF_BIRTH',
        'SEX',
        'TOWN_VILL',
        'WARD_STREET',
        'DATE_OF_REGISTRATION',
        'FATHER_ID_NUMBER',
        'FATHER_FORENAME',
        'FATHER_SURNAME',
        'FATHER_OTHER_NAME',
        'FATHER_NATIONALITY',
        'MOTHER_ID_NUMBER',
        'MOTHER_FORENAME',
        'MOTHER_SURNAME',
        'MOTHER_OTHER_NAME',
        'MOTHER_NATIONALITY',
        'DATE_OF_ISSUE',
        'YEAR_OF_REGISTRATION',
        'DATE_OF_COLLECTION',
        'MOTHER_AGE',
        'MOTHER_MARITAL_STATUS'
    ];
  private readonly logger = new Logger(BirthRepository.name);
  private readonly viewName = 'V_BIRTH';
  private readonly _death_viewName = 'V_DEATH';


  constructor(

    @InjectConnection('birthConnection')
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
  
  
  

  async getById(idNo: string): Promise<BirthRecord | null> {
    const query = `
        SELECT ${this._birthSelectColumns}
        FROM ${this.viewName}
        WHERE ROWNUM = 1 AND UPPER(ID_NUMBER) = UPPER(:ID)
    `;
    const idParameter = idNo; // parameter to prevent SQL injection
    let result: BirthRecord | null = null;

    const queryRunner = this.connection.createQueryRunner();

    try {
        await queryRunner.connect();
        const rows = await queryRunner.query(query, [idParameter]);

        if (rows && rows.length > 0) {
            result = this.getBirthFromRow(rows);
        }
    } finally {
        await queryRunner.release();
    }

    return result;
  }

  private getBirthFromRow(row: any): BirthRecord {
    const result = new BirthRecord();
    result.ID_NUMBER= row.ID_NUMBER?.toString() ?? null;
    result.BIRTH_CERTIFICATE= row.BIRTH_CERTIFICATE?.toString() ?? null;
    result.BIRTH_CERTIFICATE_OLD= row.BIRTH_CERTIFICATE_OLD?.toString() ?? null;
    result.FORENAME= row.FORENAME?.toString() ?? null;
    result.SURNAME= row.SURNAME?.toString() ?? null;
    result.DATE_OF_BIRTH= row.DATE_OF_BIRTH !== null ? new Date(row.DATE_OF_BIRTH) : null;
    result.DISTRICT_OF_BIRTH= row.DISTRICT_OF_BIRTH?.toString() ?? null;
    result.DISTRICT_OF_BIRTH_NAME= row.DISTRICT_OF_BIRTH_NAME?.toString() ?? null;
    result.FATHER_FORENAME= row.FATHER_FORENAME?.toString() ?? null;
    result.FATHER_ID_NUMBER= row.FATHER_ID_NUMBER?.toString() ?? null;
    result.DATE_OF_COLLECTION= row.DATE_OF_COLLECTION !== null ? new Date(row.DATE_OF_COLLECTION) : null;
    result.DATE_OF_ISSUE= row.DATE_OF_ISSUE !== null ? new Date(row.DATE_OF_ISSUE) : null;
    result.DATE_OF_REGISTRATION= row.DATE_OF_REGISTRATION !== null ? new Date(row.DATE_OF_REGISTRATION) : null;
    result.YEAR_OF_REGISTRATION= row.YEAR_OF_REGISTRATION?.toString() ?? null;
    result.FATHER_NATIONALITY= row.FATHER_NATIONALITY?.toString() ?? null;
    result.FATHER_OTHER_NAME= row.FATHER_OTHER_NAME?.toString() ?? null;
    result.FATHER_SURNAME= row.FATHER_SURNAME?.toString() ?? null;
    result.MOTHER_AGE= row.MOTHER_AGE?.toString() ?? null;
    result.MOTHER_FORENAME= row.MOTHER_FORENAME?.toString() ?? null;
    result.MOTHER_ID_NUMBER= row.MOTHER_ID_NUMBER?.toString() ?? null;
    result.MOTHER_MARITAL_STATUS= row.MOTHER_MARITAL_STATUS?.toString() ?? null;
    result.MOTHER_OTHER_NAME= row.MOTHER_OTHER_NAME?.toString() ?? null;
    result.OTHER_NAME= row.OTHER_NAME?.toString() ?? null;
    result.MOTHER_SURNAME= row.MOTHER_SURNAME?.toString() ?? null;
    result.SEX= row.SEX?.toString() ?? null;
    result.TOWN_VILL= row.TOWN_VILL?.toString() ?? null;
    result.REGISTRATION_NUMBER= row.REGISTRATION_NUMBER?.toString() ?? null;
    result.WARD_STREET= row.WARD_STREET?.toString() ?? null;
    result.TYPE_OF_BIRTH= row.TYPE_OF_BIRTH?.toString() ?? null;

    return result;
  }

  private getBirthDeathFromRow(row: any): BirthDeathRecord {
    const result = new BirthDeathRecord ();
    result.ID_NUMBER= row.ID_NUMBER?.toString() ?? null ;
    result.BIRTH_CERTIFICATE= row.BIRTH_CERTIFICATE?.toString() ?? null;
    result.FORENAME= row.FORENAME?.toString() ?? null;
    result.SURNAME= row.SURNAME?.toString()  ?? null;
    result.DATE_OF_BIRTH= row.DATE_OF_BIRTH !== null ? new Date(row.DATE_OF_BIRTH) : null;
    result.DISTRICT_OF_BIRTH= row.DISTRICT_OF_BIRTH?.toString() ?? null;
    result.DISTRICT_OF_BIRTH_NAME= row.DISTRICT_OF_BIRTH_NAME?.toString()  ?? null;
    result.FATHER_FORENAME= row.FATHER_FORENAME?.toString() ?? null;
    result.FATHER_ID_NUMBER= row.FATHER_ID_NUMBER?.toString() ?? null;
    result.DATE_OF_COLLECTION= row.DATE_OF_COLLECTION !== null ? new Date(row.DATE_OF_COLLECTION) : null;
    result.DATE_OF_ISSUE= row.DATE_OF_ISSUE !== null ? new Date(row.DATE_OF_ISSUE) : null;
    result.DATE_OF_REGISTRATION= row.DATE_OF_REGISTRATION !== null ? new Date(row.DATE_OF_REGISTRATION) : null;
    result.YEAR_OF_REGISTRATION= row.YEAR_OF_REGISTRATION?.toString() ?? null ;
    result.FATHER_NATIONALITY= row.FATHER_NATIONALITY?.toString() ?? null ;
    result.FATHER_OTHER_NAME= row.FATHER_OTHER_NAME?.toString()  ?? null ;
    result.FATHER_SURNAME= row.FATHER_SURNAME?.toString()  ?? null;
    result.MOTHER_AGE= row.MOTHER_AGE?.toString()  ?? null;
    result.MOTHER_FORENAME= row.MOTHER_FORENAME?.toString()  ?? null;
    result.MOTHER_ID_NUMBER= row.MOTHER_ID_NUMBER?.toString()  ?? null;
    result.MOTHER_MARITAL_STATUS= row.MOTHER_MARITAL_STATUS?.toString()  ?? null;
    result.MOTHER_OTHER_NAME= row.MOTHER_OTHER_NAME?.toString()  ?? null;
    result.OTHER_NAME= row.OTHER_NAME?.toString()  ?? null;
    result.MOTHER_SURNAME= row.MOTHER_SURNAME?.toString()  ?? null;
    result.SEX= row.SEX?.toString()  ?? null;
    result.TOWN_VILL= row.TOWN_VILL?.toString()  ?? null;
    result.WARD_STREET= row.WARD_STREET?.toString()  ?? null;
    result.TYPE_OF_BIRTH= row.TYPE_OF_BIRTH?.toString()  ?? null;

    result.ID_NUMBER_NEXT_OF_KIN= row.ID_NUMBER_NEXT_OF_KIN?.toString()  ?? null;
    result.DATE_OF_DEATH= row.DATE_OF_DEATH !== null ? new Date(row.DATE_OF_DEATH) : null;
    result.AGE_DAYS= row.AGE_DAYS?.toString() ?? null;
    result.AGE_MONTHS= row.AGE_MONTHS?.toString() ?? null;
    result.AGE_YEARS= row.AGE_YEARS?.toString() ?? null;
    result.CAUSE_OF_DEATH= row.CAUSE_OF_DEATH?.toString() ?? null;
    result.CODE_ICD10= row.CODE_ICD10?.toString() ?? null;
    result.DEATH_CERTIFICATE= row.DEATH_CERTIFICATE?.toString() ?? null;
    result.DISTRICT_OF_DEATH= row.DISTRICT_OF_DEATH?.toString() ?? null;
    result.DISTRICT_OF_DEATH_NAME= row.DISTRICT_OF_DEATH_NAME?.toString() ?? null;
    result.DISTRICT_OF_REGISTRATION= row.DISTRICT_OF_REGISTRATION?.toString() ?? null;
    result.FORENAME_NEXT_OF_KIN= row.FORENAME_NEXT_OF_KIN?.toString() ?? null;
    result.NATIONALITY= row.NATIONALITY?.toString() ?? null;
    result.NATIONALITY_NEXT_OF_KIN= row.NATIONALITY_NEXT_OF_KIN?.toString() ?? null;
    result.OCCUPATION= row.OCCUPATION?.toString() ?? null;
    result.PLACE_OF_DEATH= row.PLACE_OF_DEATH?.toString() ?? null;
    result.TYPE_OF_RELATIONSHIP= row.TYPE_OF_RELATIONSHIP?.toString() ?? null;
    
 

    return result;
  }
  
  async getByLastName(lastName: string, pager: Pager): Promise<BirthRecord[]> {
    lastName += '%';
    const filter = 'UPPER(SURNAME) LIKE UPPER(:lastName)';
    const lParameter = lastName;

    const query = `
        SELECT *
        FROM (
            SELECT a.*, rownum r
            FROM (
                SELECT ${this._birthSelectColumns}
                FROM ${this.viewName}
                WHERE ${filter}
                ORDER BY ID_NUMBER
            ) a
            WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
        )
        WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
    `;

    const result: BirthRecord[] = [];

    const queryRunner = this.connection.createQueryRunner();

    try {
        await queryRunner.connect();
        const rows = await queryRunner.query(query, [lParameter]);

        if (rows && rows.length > 0) {
            for (const row of rows) {
                result.push(this.getBirthFromRow(row));
            }
        }
    } finally {
        await queryRunner.release();
    }

    return result;
    }

    
  async getByName(firstName: string, lastName: string, pager: Pager): Promise<BirthRecord[]> {
    firstName += '%';
    lastName += '%';
    const filter = 'UPPER(FORENAME) LIKE UPPER(:firstName) AND UPPER(SURNAME) LIKE UPPER(:lastName)';
    const fParameter = firstName; // parameter to prevent SQL injection
    const lParameter = lastName; // parameter to prevent SQL injection

    const query = `
        SELECT *
        FROM (
            SELECT a.*, rownum r
            FROM (
                SELECT ${this._birthSelectColumns}
                FROM ${this.viewName}
                WHERE ${filter}
                ORDER BY ID_NUMBER
            ) a
            WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
        )
        WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
    `;

    const result: BirthRecord[] = [];

    const queryRunner = this.connection.createQueryRunner();

    try {
        await queryRunner.connect();
        const rows = await queryRunner.query(query, [fParameter, lParameter]);

        if (rows && rows.length > 0) {
            for (const row of rows) {
                result.push(this.getBirthFromRow(row));
            }
        }
    } finally {
        await queryRunner.release();
    }

    return result;
  }

  async getByNameWithMiddleName(firstName: string, middleName: string, lastName: string, pager: Pager): Promise<BirthRecord[]> {
    firstName += '%';
    middleName += '%';
    lastName += '%';
    const filter = 'UPPER(FORENAME) LIKE UPPER(:lastName) AND UPPER(OTHER_NAME) LIKE UPPER(:middleName) AND UPPER(SURNAME) LIKE UPPER(:lastName)';
    const fParameter = firstName; // parameter to prevent SQL injection
    const oParameter = middleName; // parameter to prevent SQL injection
    const lParameter = lastName; // parameter to prevent SQL injection

    const query = `
        SELECT *
        FROM (
            SELECT a.*, rownum r
            FROM (
                SELECT ${this._birthSelectColumns}
                FROM ${this.viewName}
                WHERE ${filter}
                ORDER BY ID_NUMBER
            ) a
            WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
        )
        WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
    `;

    const result: BirthRecord[] = [];

    const queryRunner = this.connection.createQueryRunner();

    try {
        await queryRunner.connect();
        const rows = await queryRunner.query(query, [fParameter, oParameter, lParameter]);

        if (rows && rows.length > 0) {
            for (const row of rows) {
                result.push(this.getBirthFromRow(row));
            }
        }
    } finally {
        await queryRunner.release();
    }

    return result;
  }

  async getMany(IDNO: string[], pager: Pager): Promise<BirthDeathRecord[]> {
    const parameters : any = {};
    IDNO.forEach((id, index) => {
        parameters[`ID${index}`] = id;
    });

    const filter = IDNO.map((_, i) => `UPPER(${this.viewName}.ID_NUMBER) = :ID${i}`).join(' OR ');

    const query = `SELECT *
    FROM (
        SELECT a.*, rownum r
        FROM (
            SELECT ${this._birthSelectColumns.map(column => `${this.viewName}.${column}`)},
                   ${this._deathSelectColumns.map(column => `${this._death_viewName}.${column}`)}  
            FROM ${this.viewName}
            LEFT OUTER JOIN ${this._death_viewName} ON ${this.viewName}.ID_NUMBER = ${this._death_viewName}.ID_NUMBER  
            WHERE ${filter}
            ORDER BY ${this.viewName}.ID_NUMBER
        ) a
        WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
    )
    WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
    `;

    const result: BirthDeathRecord[] = [];

    const queryRunner = this.connection.createQueryRunner();

    try {
        await queryRunner.connect();
        const rows = await queryRunner.query(query, parameters);

        if (rows && rows.length > 0) {
            for (const row of rows) {
                result.push(this.getBirthDeathFromRow(row));
            }
        }
    } finally {
        await queryRunner.release();
    }

    return result;
  }

    
  async findBirthsByDate(startDate: Date  | null, endDate: Date  | null, pager: Pager): Promise<BirthRecord[]> {

    const filter = `DATE_OF_BIRTH IS NOT NULL 
                    AND DATE_OF_BIRTH >= :startDate 
                    AND DATE_OF_BIRTH <= :endDate`;
                    
    const sParameter = startDate ? startDate : null;
    const eParameter =  endDate ? endDate : null;

    const query = `
        SELECT *
        FROM (
            SELECT a.*, rownum r
            FROM (
                SELECT ${this._birthSelectColumns}
                FROM ${this.viewName}
                WHERE ${filter}
                ORDER BY ID_NUMBER
            ) a
            WHERE rownum < ((${pager.pageNum} * ${pager.pageSize}) + 1)
        )
        WHERE r >= (((${pager.pageNum} - 1) * ${pager.pageSize}) + 1)
    `;

    const result: BirthRecord[] = [];

    const queryRunner = this.connection.createQueryRunner();

    try {
        await queryRunner.connect();
        const rows = await queryRunner.query(query, [sParameter, eParameter]);

        if (rows && rows.length > 0) {
            for (const row of rows) {
                result.push(this.getBirthFromRow(row));
            }
        }
    } finally {
        await queryRunner.release();
    }

    return result;
  }
}