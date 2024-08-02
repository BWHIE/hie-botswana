import { DataSourceOptions } from 'typeorm';
import config from './index';

export const createOracleDataSourceOptions = (
  name: string,
  userConfigKey: string,
  passwordConfigKey: string,
  synchronize: boolean = false,
  hasServiceName: boolean = false,
): DataSourceOptions => ({
  name,
  type: 'oracle',
  username: userConfigKey,
  password: passwordConfigKey,
  connectString: `(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = ${config.get('Oracle:DbHost')})(PORT = ${config.get('Oracle:DbPort')}))(CONNECT_DATA = (SID = ${config.get('Oracle:DbSid')})${hasServiceName ? `(SERVICE_NAME = ${config.get('Oracle:DbSid')})` : ''}))`,
  synchronize,
});

export const omangDataSourceOptions: DataSourceOptions =
  createOracleDataSourceOptions(
    'omangConnection',
    config.get('Oracle:Omang:CitizenUsername'),
    config.get('Oracle:Omang:CitizenPassword'),
  );

export const birthDataSourceOptions: DataSourceOptions =
  createOracleDataSourceOptions(
    'birthConnection',
    config.get('Oracle:Births:BdrsUsername'),
    config.get('Oracle:Births:BdrsPassword'),
    true,
    true,
  );

export const deathDataSourceOptions: DataSourceOptions =
  createOracleDataSourceOptions(
    'deathConnection',
    config.get('Oracle:Deaths:BdrsUsername'),
    config.get('Oracle:Deaths:BdrsPassword'),
    true,
  );

export const immigrationDataSourceOptions: DataSourceOptions =
  createOracleDataSourceOptions(
    'immigrationConnection',
    config.get('Oracle:Immigration:ImmigrationUsername'),
    config.get('Oracle:Immigration:ImmigrationPassword'),
    true,
  );
