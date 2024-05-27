import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

export const omangDataSourceOptions: DataSourceOptions = {
  type: 'oracle',
  username: 'omang',
  password: 'some-password',
  connectString:
    '(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = oracle-db)(PORT = 1521))(CONNECT_DATA = (SID = XE)))',
  database: 'OMANG_CITIZEN',
};

export const birthDataSourceOptions: DataSourceOptions = {
  name: 'birthConnection',
  type: 'oracle',
  username: 'bdr',
  password: 'some-password',
  connectString:
    '(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = oracle-db)(PORT = 1521))(CONNECT_DATA = (SID = XE)(SERVICE_NAME = XE)))',
  synchronize: true,
};

export const deathDataSourceOptions: DataSourceOptions = {
  name: 'deathConnection',
  type: 'oracle',
  username: 'bdr',
  password: 'some-password',
  database: 'V_DEATH',
  connectString:
    '(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = oracle-db)(PORT = 1521))(CONNECT_DATA = (SID = XE)))',
  synchronize: true,
};

export const immigrationDataSourceOptions: DataSourceOptions = {
  name: 'immigrationConnection',
  type: 'oracle',
  username: 'immigration',
  password: 'some-password',
  database: 'V_MOH',
  connectString:
    '(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = oracle-db)(PORT = 1521))(CONNECT_DATA = (SID = XE)))',
  synchronize: true,
};
