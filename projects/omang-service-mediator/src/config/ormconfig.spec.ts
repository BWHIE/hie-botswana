// Mock process.env values
process.env.ORACLE_OMANG_VIEW_NAME = 'ORACLE_OMANG_VIEW_NAME';
process.env.ORACLE_OMANG_CITIZEN_USERNAME = 'omangUser';
process.env.ORACLE_OMANG_CITIZEN_PASSWORD = 'omangPass';
process.env.ORACLE_IMMIGRATION_VIEW_NAME = 'ORACLE_IMMIGRATION_VIEW_NAME';
process.env.ORACLE_IMMIGRATION_USERNAME = 'immigrationUser';
process.env.ORACLE_IMMIGRATION_PASSWORD = 'immigrationPass';
process.env.ORACLE_BIRTHS_VIEW_NAME = 'ORACLE_BIRTHS_VIEW_NAME';
process.env.ORACLE_BDRS_USERNAME = 'birthUser';
process.env.ORACLE_BDRS_PASSWORD = 'birthPass';
process.env.ORACLE_DEATHS_VIEW_NAME = 'ORACLE_DEATHS_VIEW_NAME';
process.env.ORACLE_DB_HOST = 'localhost';
process.env.ORACLE_DB_SID = 'XE';
process.env.ORACLE_DB_PORT = '1521';

// Import necessary modules and methods
import {
  //   omangDataSourceOptions,
  birthDataSourceOptions,
  deathDataSourceOptions,
  immigrationDataSourceOptions,
  createOracleDataSourceOptions,
} from './ormconfig';
import config from '.';

describe('DataSourceOptions creation', () => {
  test('should create correct Oracle DataSourceOptions for Omang', () => {
    const options = createOracleDataSourceOptions(
      'omangConnection',
      config.get('Oracle:Omang:CitizenUsername'),
      config.get('Oracle:Omang:CitizenPassword'),
      false,
      false,
    );
    expect(options).toEqual({
      name: 'omangConnection',
      type: 'oracle',
      username: 'omangUser',
      password: 'omangPass',
      connectString:
        '(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA = (SID = XE)))',
      synchronize: false,
    });
  });

  test('should create correct DataSourceOptions for Births with service name', () => {
    expect(birthDataSourceOptions).toEqual({
      name: 'birthConnection',
      type: 'oracle',
      username: 'birthUser',
      password: 'birthPass',
      connectString:
        '(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA = (SID = XE)(SERVICE_NAME = XE)))',
      synchronize: true,
    });
  });

  test('should create correct DataSourceOptions for Deaths without service name', () => {
    expect(deathDataSourceOptions).toEqual({
      name: 'deathConnection',
      type: 'oracle',
      username: 'birthUser',
      password: 'birthPass',
      connectString:
        '(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA = (SID = XE)))',
      synchronize: true,
    });
  });

  test('should create correct DataSourceOptions for Immigration without service name', () => {
    expect(immigrationDataSourceOptions).toEqual({
      name: 'immigrationConnection',
      type: 'oracle',
      username: 'immigrationUser',
      password: 'immigrationPass',
      connectString:
        '(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA = (SID = XE)))',
      synchronize: true,
    });
  });
});
