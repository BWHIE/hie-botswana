import { DataSourceOptions } from 'typeorm';
import config from 'src/config';

const createOracleDataSourceOptions = (
  name: string,
  userConfigKey: string,
  passwordConfigKey: string,
  synchronize: boolean = false,
  hasServiceName: boolean = false,
): DataSourceOptions => ({
  name,
  type: 'oracle',
  username: config.get(userConfigKey),
  password: config.get(passwordConfigKey),
  connectString: `(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = ${config.get('DB_HOST')})(PORT = ${config.get('DB_PORT')}))(CONNECT_DATA = (SID = ${config.get('DB_SID')})${hasServiceName ? `(SERVICE_NAME = ${config.get('DB_SID')})` : ''}))`,
  synchronize,
});

export const omangDataSourceOptions: DataSourceOptions =
  createOracleDataSourceOptions(
    'omangConnection',
    'CITIZEN_USERNAME',
    'CITIZEN_PASSWORD',
  );

export const birthDataSourceOptions: DataSourceOptions =
  createOracleDataSourceOptions(
    'birthConnection',
    'BDRS_USERNAME',
    'BDRS_PASSWORD',
    true,
    true,
  );

export const deathDataSourceOptions: DataSourceOptions =
  createOracleDataSourceOptions(
    'deathConnection',
    'BDRS_USERNAME',
    'BDRS_PASSWORD',
    true,
  );

export const immigrationDataSourceOptions: DataSourceOptions =
  createOracleDataSourceOptions(
    'immigrationConnection',
    'IMMIGRATION_USERNAME',
    'IMMIGRATION_PASSWORD',
    true,
  );
