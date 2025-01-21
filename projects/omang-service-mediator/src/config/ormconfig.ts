import { DataSourceOptions } from 'typeorm';
import config from './index';

export const createOracleDataSourceOptions = (
  name: string,
  userConfigKey: string,
  passwordConfigKey: string,
  connectString: string,
  synchronize: boolean = false,
  hasServiceName: boolean = false,
): DataSourceOptions => ({
  name,
  type: 'oracle',
  username: userConfigKey,
  password: passwordConfigKey,
  connectString: connectString,
  synchronize,
  extra: {
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
    poolTimeout: 10,
    queueTimeout: 5000,
    enableStatistics: true,
    poolPingInterval: 60
  }
});

export const omangDataSourceOptions: DataSourceOptions =
  createOracleDataSourceOptions(
    'omangConnection',
    config.get('Oracle:Omang:CitizenUsername'),
    config.get('Oracle:Omang:CitizenPassword'),
    config.get('Oracle:Omang:CitizenConnectionString'),
  );

export const birthDataSourceOptions: DataSourceOptions =
  createOracleDataSourceOptions(
    'birthConnection',
    config.get('Oracle:Births:BdrsUsername'),
    config.get('Oracle:Births:BdrsPassword'),
    config.get('Oracle:Births:BdrsConnectionString'),
    true,
    true,
  );

export const deathDataSourceOptions: DataSourceOptions =
  createOracleDataSourceOptions(
    'deathConnection',
    config.get('Oracle:Deaths:BdrsUsername'),
    config.get('Oracle:Deaths:BdrsPassword'),
    config.get('Oracle:Deaths:BdrsConnectionString'),
    true,
  );

export const immigrationDataSourceOptions: DataSourceOptions =
  createOracleDataSourceOptions(
    'immigrationConnection',
    config.get('Oracle:Immigration:ImmigrationUsername'),
    config.get('Oracle:Immigration:ImmigrationPassword'),
    config.get('Oracle:Immigration:ImmigrationConnectionString'),
    true,
  );
