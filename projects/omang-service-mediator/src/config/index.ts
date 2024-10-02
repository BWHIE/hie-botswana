class Config {
  private _config = {
    ClientRegistry: {
      ApiUrl: process.env.CLIENT_REGISTRY_API_URL,
      OmangSystem: process.env.CLIENT_REGISTRY_OMANG_SYSTEM,
      BdrsSystem: process.env.CLIENT_REGISTRY_BDRS_SYSTEM,
      ImmigrationSystem: process.env.CLIENT_REGISTRY_IMMIGRATION_SYSTEM,
      maxDaysBeforeUpdate: parseInt(
        process.env.CLIENT_REGISTRY_MAX_DAYS_BEFORE_UPDATE || '2',
      ),
      devMode: process.env.CLIENT_REGISTRY_DEV_MODE === 'true',
    },
    Logger: {
      MaxLogSize: process.env.LOGGER_MAX_LOG_SIZE,
      MaxNumofLogs: parseInt(process.env.LOGGER_MAX_NUM_OF_LOGS || '10'),
    },
    Auth: {
      Basic: {
        Id: parseInt(process.env.AUTH_BASIC_ID || '1'),
        Username: process.env.AUTH_BASIC_USERNAME,
        Password: process.env.AUTH_BASIC_PASSWORD,
      },
    },
    SafeList: {
      IP: process.env.SAFE_LIST_IP,
    },
    Oracle: {
      Omang: {
        CitizenConnectionString:
          process.env.ORACLE_OMANG_CITIZEN_CONNECTION_STRING,
        ViewName: process.env.ORACLE_OMANG_VIEW_NAME,
        CitizenUsername: process.env.ORACLE_OMANG_CITIZEN_USERNAME,
        CitizenPassword: process.env.ORACLE_OMANG_CITIZEN_PASSWORD,
      },
      Immigration: {
        ImmigrationConnectionString:
          process.env.ORACLE_OMANG_IMMIGRATION_CONNECTION_STRING,
        ViewName: process.env.ORACLE_IMMIGRATION_VIEW_NAME,
        ImmigrationUsername: process.env.ORACLE_IMMIGRATION_USERNAME,
        ImmigrationPassword: process.env.ORACLE_IMMIGRATION_PASSWORD,
      },
      Births: {
        BdrsConnectionString: process.env.ORACLE_OMANG_BDRS_CONNECTION_STRING,
        ViewName: process.env.ORACLE_BIRTHS_VIEW_NAME,
        BdrsUsername: process.env.ORACLE_BDRS_USERNAME,
        BdrsPassword: process.env.ORACLE_BDRS_PASSWORD,
      },
      Deaths: {
        BdrsConnectionString: process.env.ORACLE_OMANG_BDRS_CONNECTION_STRING,
        ViewName: process.env.ORACLE_DEATHS_VIEW_NAME,
        BdrsUsername: process.env.ORACLE_BDRS_USERNAME,
        BdrsPassword: process.env.ORACLE_BDRS_PASSWORD,
      },
      DbHost: process.env.ORACLE_DB_HOST,
      DbSid: process.env.ORACLE_DB_SID,
      DbPort: process.env.ORACLE_DB_PORT,
    },
    mediatorConfig: {
      openHimAuth: {
        username: process.env.OPENHIM_AUTH_USERNAME,
        password: process.env.OPENHIM_AUTH_PASSWORD,
        trustSelfSigned: process.env.OPENHIM_AUTH_TRUST_SELF_SIGNED === 'true',
        apiURL: process.env.OPENHIM_AUTH_API_URL,
        rejectUnauthorized: process.env.OPENHIM_AUTH_REJECT_UNAUTHORIZED,
        urn: process.env.OPENHIM_AUTH_URN,
      },
      mediatorCore: {
        openHimCoreHost: process.env.MEDIATOR_CORE_OPENHIM_CORE_HOST,
        openHimRegisterMediatorPath:
          process.env.MEDIATOR_CORE_OPENHIM_REGISTER_MEDIATOR_PATH,
        openHimheartbeatpath: process.env.MEDIATOR_CORE_OPENHIM_HEARTBEAT_PATH,
        heartbeatInterval: parseInt(
          process.env.MEDIATOR_CORE_HEARTBEAT_INTERVAL || '10',
        ),
        isHeartbeatDisabled: process.env.MEDIATOR_CORE_IS_HEARTBEAT_DISABLED,
      },
      mediatorSetup: {
        urn: process.env.MEDIATOR_SETUP_URN,
        version: process.env.MEDIATOR_SETUP_VERSION,
        name: process.env.MEDIATOR_SETUP_NAME,
        description: process.env.MEDIATOR_SETUP_DESCRIPTION,
        defaultChannelConfig: [
          {
            methods: ['GET'],
            name: 'Omang',
            urlPattern: '^/omang.*$',
            type: 'http',
            routes: [
              {
                name: 'Omang API',
                host: 'omang-api',
                port: '5002',
                type: 'http',
                path: '',
                pathTransform: 's/omang/api\\/Omang/g',
                primary: true,
              },
            ],
            allow: ['test'],
          },
          {
            methods: ['GET'],
            name: 'BDRS',
            urlPattern: '^/bdrs.*$',
            type: 'http',
            routes: [
              {
                name: 'BDRS API',
                host: 'omang-api',
                port: '5002',
                type: 'http',
                path: '',
                pathTransform: 's/bdrs/api\\/BDRS/g',
                primary: true,
              },
            ],
            allow: ['test'],
          },
          {
            methods: ['GET'],
            name: 'Patient',
            urlPattern: '^/CR/validate/Patient.*$',
            type: 'http',
            routes: [
              {
                name: 'Patient API',
                host: 'omang-api',
                port: '5002',
                type: 'http',
                path: '/api/Patient/get',
                pathTransform: '',
                primary: true,
              },
            ],
            allow: ['test'],
          },
          {
            methods: ['GET'],
            name: 'Immigration',
            urlPattern: '^/patient.*$',
            type: 'http',
            routes: [
              {
                name: 'Omang API',
                host: 'omang-api',
                port: '5002',
                type: 'http',
                path: '',
                pathTransform: 's/omang/api\\/Patient/g',
                primary: true,
              },
            ],
            allow: ['test'],
          },
        ],
        endpoints: [
          {
            name: 'omang',
            host: 'omang-api',
            path: '/api/omang',
            port: '5002',
            primary: true,
            type: 'http',
          },
          {
            name: 'bdrs',
            host: 'omang-api',
            path: '/api/bdrs',
            port: '5002',
            primary: true,
            type: 'http',
          },
          {
            name: 'patient',
            host: 'omang-api',
            path: '/api/Patient/get',
            port: '5002',
            primary: true,
            type: 'http',
          },
        ],
      },
    },
  };

  public get(path: string): any {
    const keys = path.split(':');
    let result = this._config;

    for (const key of keys) {
      if (!(key in result)) {
        return undefined;
      }
      result = result[key];
    }
    return result;
  }

  public set(path: string, value: any): void {
    const keys = path.split(':');
    let current = this._config;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  }
}

const config = new Config();

export default config;
