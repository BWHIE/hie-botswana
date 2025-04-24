class Config {
  private static mergeEnvVariables(): any {
    const envConfig: any = {
      app: {
        port: process.env.HTTP_PORT,
        devMode: process.env.DEV_MODE,
      },
      mfl: {
        apiUrl: process.env.MFL_API_URL,
        timeout: process.env.MFL_TIMEOUT || 30000,
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
              methods: ["GET"],
              type: "http",
              whitelist: [],
              allow: ["test"],
              authType: "private",
              matchContentTypes: [],
              properties: [],
              status: "enabled",
              rewriteUrls: false,
              addAutoRewriteRules: true,
              autoRetryEnabled: false,
              autoRetryPeriodMinutes: 60,
              requestBody: true,
              responseBody: true,
              description: "Get the MFL Bundles",
              urlPattern: "^/MFL/.*$",
              routes: [
                {
                  type: "http",
                  status: "enabled",
                  forwardAuthHeader: false,
                  name: "MFL - Get Bundle",
                  secured: false,
                  host: "mfl-api",
                  port: 3000,
                  path: "",
                  pathTransform: "s/MFL\\///g",
                  primary: true,
                  username: "",
                  password: "",
                },
              ],
              alerts: [],
              rewriteUrlsConfig: [],
              priority: 3,
              name: "MFL",
            },
          ],
          endpoints: [
            {
              name: "MFL Endpoint",
              host: "mfl-api",
              path: "/",
              port: 3000,
              primary: true,
              forwardAuthHeader: false,
              status: "enabled",
              type: "http",
            },
          ],
        },
      },
      Logger: {
        MaxLogSize: process.env.LOGGER_MAX_LOG_SIZE,
        MaxNumofLogs: process.env.LOGGER_MAX_NUM_OF_LOGS,
      },
    };

    return envConfig;
  }

  private static config: any = Config.mergeEnvVariables();

  public get(path: string): any {
    const keys = path.split(":");
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
    const keys = path.split(":");
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
