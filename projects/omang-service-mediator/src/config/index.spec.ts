// Mock process.env values
process.env.CLIENT_REGISTRY_API_URL = 'http://example.com';
process.env.CLIENT_REGISTRY_OMANG_SYSTEM = 'omangSystemValue';
process.env.CLIENT_REGISTRY_MAX_DAYS_BEFORE_UPDATE = '7';
process.env.AUTH_BASIC_USERNAME = 'user';
process.env.AUTH_BASIC_PASSWORD = 'password';
process.env.OPENHIM_AUTH_USERNAME = 'openhimUser';
process.env.MEDIATOR_CORE_OPENHIM_CORE_HOST = 'http://localhost:5000';

import config from './index';

describe('Config class', () => {
  test('should retrieve API URL correctly', () => {
    const apiUrl = config.get('ClientRegistry:ApiUrl');
    expect(apiUrl).toEqual('http://example.com');
  });

  test('should retrieve default value for maxDaysBeforeUpdate', () => {
    delete process.env.CLIENT_REGISTRY_MAX_DAYS_BEFORE_UPDATE;
    const maxDays = config.get('ClientRegistry:maxDaysBeforeUpdate');
    expect(maxDays).toEqual(7); // Default value
  });

  test('should set a new value correctly', () => {
    config.set('ClientRegistry:ApiUrl', 'http://newexample.com');
    const apiUrl = config.get('ClientRegistry:ApiUrl');
    expect(apiUrl).toEqual('http://newexample.com');
  });

  test('should handle nested paths correctly', () => {
    const username = config.get('Auth:Basic:Username');
    expect(username).toEqual('user');
  });

  test('should return undefined for non-existent config', () => {
    const nonExistent = config.get('NonExistent:Config');
    expect(nonExistent).toBeUndefined();
  });

  afterAll(() => {
    // Reset process.env if necessary or clear mock
  });
});
