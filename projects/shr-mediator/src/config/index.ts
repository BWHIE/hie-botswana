import * as nconf from 'nconf';
import * as dotenv from 'dotenv';
import { camelCase } from 'lodash';

dotenv.config();

nconf.argv().env().file(`${__dirname}/../../src/app-settings.json`);

const parseEnvVariable = (envVar: string) => {
  try {
    return JSON.parse(envVar);
  } catch (error) {
    if (envVar.includes(',')) {
      return envVar.split(',');
    }
    return envVar;
  }
};

const setNestedConfig = (keyParts: string[], value: any) => {
  const normalizedKeyParts = keyParts.map((part, index) => {
    const camelCasedPart = part.includes('_')
      ? camelCase(part)
      : part.toLowerCase();
    return index === 0 ? camelCasedPart : camelCasedPart;
  });
  const configKey = normalizedKeyParts.join(':');
  nconf.set(configKey, value);
};

const jsonEnvVariables = process.env.JSON_ENV_VARIABLES
  ? process.env.JSON_ENV_VARIABLES.split(',')
  : [];

Object.keys(process.env).forEach((key) => {
  let value = process.env[key];

  if (jsonEnvVariables.includes(key)) {
    value = parseEnvVariable(value);
  }

  const keyParts = key.split('__');

  setNestedConfig(keyParts, value);
});

export { nconf as config };

export default nconf;
