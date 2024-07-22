import * as dotenv from 'dotenv';

dotenv.config();

class Config {
  private static parseJsonEnvVariable(envVar: string): any {
    try {
      return JSON.parse(envVar);
    } catch (error) {
      throw new Error(`Failed to parse JSON environment variable: ${envVar}`);
    }
  }

  private static mergeEnvVariables(): any {
    const envConfig: any = {
      app: {
        port: process.env.SHR_HTTP_PORT,
        mllpPort: process.env.SHR_MLLP_PORT,
      },
      ClientRegistry: {
        ApiUrl: process.env.CLIENT_REGISTRY_API_URL,
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
          targetIp: process.env.MLLP_TARGET_IP,
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
          defaultChannelConfig: process.env.DEFAULT_CHANNEL_CONFIG
            ? Config.parseJsonEnvVariable(process.env.DEFAULT_CHANNEL_CONFIG)
            : undefined,
          endpoints: process.env.ENDPOINTS
            ? Config.parseJsonEnvVariable(process.env.ENDPOINTS)
            : undefined,
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
