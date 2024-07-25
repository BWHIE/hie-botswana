import * as dotenv from 'dotenv';

dotenv.config();

class Config {
  private static mergeEnvVariables(): any {
    const envConfig: any = {
      app: {
        port: process.env.HTTP_PORT,
        mllpPort: process.env.MLLP_PORT,
      },
      ClientRegistry: {
        ApiUrl: process.env.CLIENT_REGISTRY_API_URL,
        OmangSystem: process.env.OMANG_SYSTEM,
        BdrsSystem: process.env.BDRS_SYSTEM,
        ImmigrationSystem: process.env.IMMIGRATION_SYSTEM,
        devMode: process.env.DEV_MODE,
      },
      fhirServer: {
        baseURL: process.env.FHIR_SERVER_BASE_URL,
        username: process.env.FHIR_SERVER_USERNAME,
        password: process.env.FHIR_SERVER_PASSWORD,
      },
      clientRegistryUrl: process.env.CLIENT_REGISTRY_URL,
      fhirConverterUrl: process.env.FHIR_CONVERTER_URL,
      taskRunner: {
        brokers: process.env.BROKERS
          ? process.env.BROKERS.split(',')
          : undefined,
      },
      retryConfig: {
        translatorMaxRetries: process.env.TRANSLATOR_MAX_RETRIES,
        translatorRetryDelay: process.env.TRANSLATOR_RETRY_DELAY,
        hl7MaxRetries: process.env.HL7_MAX_RETRIES,
        hl7RetryDelay: process.env.HL7_RETRY_DELAY,
        kafkaMaxRetries: process.env.KAFKA_MAX_RETRIES,
        kafkaRetryDelay: process.env.KAFKA_RETRY_DELAY,
      },
      bwConfig: {
        pimsSystemUrl: process.env.PIMS_SYSTEM_URL,
        ipmsSystemUrl: process.env.IPMS_SYSTEM_URL,
        cielSystemUrl: process.env.CIEL_SYSTEM_URL,
        loincSystemUrl: process.env.LOINC_SYSTEM_URL,
        omangSystemUrl: process.env.OMANG_SYSTEM_URL,
        bdrsSystemUrl: process.env.BDRS_SYSTEM_URL,
        labOrderSystemUrl: process.env.LAB_ORDER_SYSTEM_URL,
        mrnSystemUrl: process.env.MRN_SYSTEM_URL,
        immigrationSystemUrl: process.env.IMMIGRATION_SYSTEM_URL,
        oclUrl: process.env.OCL_URL,
        facilityCodeSystemUrl: process.env.FACILITY_CODE_SYSTEM_URL,
        ipmsProviderSystemUrl: process.env.IPMS_PROVIDER_SYSTEM_URL,
        ipmsPatientTypeSystemUrl: process.env.IPMS_PATIENT_TYPE_SYSTEM_URL,
        ipmsPatientStatusSystemUrl: process.env.IPMS_PATIENT_STATUS_SYSTEM_URL,
        ipmsXLocationSystemUrl: process.env.IPMS_X_LOCATION_SYSTEM_URL,
        ipmsOrderTypeSystemUrl: process.env.IPMS_ORDER_TYPE_SYSTEM_URL,
        requestTimeout: process.env.REQUEST_TIMEOUT,
        toIpmsAdtTemplate: process.env.TO_IPMS_ADT_TEMPLATE,
        fromIpmsAdtTemplate: process.env.FROM_IPMS_ADT_TEMPLATE,
        toIpmsOrmTemplate: process.env.TO_IPMS_ORM_TEMPLATE,
        fromIpmsOruTemplate: process.env.FROM_IPMS_ORU_TEMPLATE,
        mllp: {
          targetHost: process.env.MLLP_TARGET_HOST,
          targetAdtPort: process.env.MLLP_TARGET_ADT_PORT,
          targetOrmPort: process.env.MLLP_TARGET_ORM_PORT,
        },
      },
      Logger: {
        MaxLogSize: process.env.LOGGER_MAX_LOG_SIZE,
        MaxNumofLogs: process.env.LOGGER_MAX_NUM_OF_LOGS,
      },
      mediatorConfig: {
        openHimAuth: {
          username: process.env.OPENHIM_AUTH_USERNAME,
          password: process.env.OPENHIM_AUTH_PASSWORD,
          trustSelfSigned: process.env.OPENHIM_AUTH_TRUST_SELF_SIGNED,
          apiURL: process.env.OPENHIM_AUTH_API_URL,
          rejectUnauthorized: process.env.OPENHIM_AUTH_REJECT_UNAUTHORIZED,
          urn: process.env.OPENHIM_AUTH_URN,
        },
        mediatorCore: {
          openHimCoreHost: process.env.MEDIATOR_CORE_HOST,
          openHimRegisterMediatorPath:
            process.env.MEDIATOR_REGISTER_MEDIATOR_PATH,
          openHimheartbeatpath: process.env.MEDIATOR_HEARTBEAT_PATH,
          heartbeatInterval: process.env.MEDIATOR_HEARTBEAT_INTERVAL,
          isHeartbeatDisabled: process.env.MEDIATOR_HEARTBEAT_DISABLED,
        },
        mediatorSetup: {
          urn: process.env.MEDIATOR_SETUP_URN,
          version: process.env.MEDIATOR_SETUP_VERSION,
          name: process.env.MEDIATOR_SETUP_NAME,
          description: process.env.MEDIATOR_SETUP_DESCRIPTION,
          defaultChannelConfig: [
            {
              methods: ['GET', 'POST', 'PUT', 'PATCH'],
              type: 'http',
              whitelist: [],
              authType: 'private',
              matchContentTypes: [],
              properties: [],
              txViewAcl: [],
              txViewFullAcl: [],
              txRerunAcl: [],
              status: 'enabled',
              rewriteUrls: false,
              addAutoRewriteRules: true,
              autoRetryEnabled: false,
              autoRetryPeriodMinutes: 60,
              requestBody: true,
              responseBody: true,
              name: 'SHR - FHIR Passthrough',
              description: 'Get or Post a new FHIR Resource to the SHR',
              urlPattern: '^/SHR/fhir.*$',
              routes: [
                {
                  type: 'http',
                  status: 'enabled',
                  forwardAuthHeader: false,
                  name: 'SHR - Get/Create/Update Resource',
                  secured: false,
                  host: 'shr',
                  port: 3000,
                  path: '',
                  pathTransform: 's/SHR\\/fhir/fhir/g',
                  primary: true,
                  username: '',
                  password: '',
                },
              ],
              priority: 1,
            },
            {
              methods: ['GET', 'POST', 'DELETE', 'PUT'],
              type: 'http',
              whitelist: [],
              authType: 'private',
              matchContentTypes: [],
              properties: [],
              status: 'enabled',
              rewriteUrls: false,
              addAutoRewriteRules: true,
              autoRetryEnabled: false,
              autoRetryPeriodMinutes: 60,
              requestBody: true,
              responseBody: true,
              description: 'Get or Update the Lab Workflow Bundles in the SHR',
              urlPattern: '^/SHR/lab.*$',
              routes: [
                {
                  type: 'http',
                  status: 'enabled',
                  forwardAuthHeader: false,
                  name: 'SHR - Get Lab Bundle',
                  secured: false,
                  host: 'shr',
                  port: 3000,
                  path: '',
                  pathTransform: 's/SHR\\/lab/lab/g',
                  primary: true,
                  username: '',
                  password: '',
                },
              ],
              alerts: [],
              rewriteUrlsConfig: [],
              priority: 3,
              name: 'SHR Lab',
            },
          ],
          endpoints: [
            {
              name: 'SHR Endpoint',
              host: 'shr',
              path: '/',
              port: 3000,
              primary: true,
              forwardAuthHeader: false,
              status: 'enabled',
              type: 'http',
            },
          ],
        },
      },
    };

    return envConfig;
  }

  private static config: any = Config.mergeEnvVariables();

  public get(path: string): any {
    const keys = path.split(':');
    let result = Config.config;
    for (const key of keys) {
      if (result[key] === undefined) {
        return undefined;
      }
      result = result[key];
    }
    return result;
  }

  public set(path: string, value: any): void {
    const keys = path.split(':');
    let current = Config.config;
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
