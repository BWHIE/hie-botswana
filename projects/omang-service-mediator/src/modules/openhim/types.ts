export interface MediatorConfig {
  urn: string;
  version: string;
  name: string;
  description: string;
  defaultChannelConfig: DefaultChannelConfig[];
  endpoints: Endpoint[];
  configDefs: any[];
}

export interface DefaultChannelConfig {
  name: string;
  urlPattern: string;
  routes: Route[];
  allow: string[];
  methods: string[];
  type: string;
}

export interface Route {
  name: string;
  host: string;
  port: string;
  primary: boolean;
  type: string;
}

export interface Endpoint {
  name: string;
  host: string;
  port: string;
  path: string;
  primary: boolean;
  type: string;
}

export interface OpenHimConfig {
  username: string;
  password: string;
  trustSelfSigned: boolean;
  apiURL: string;
  rejectUnauthorized: boolean;
  urn: string;
}

export type OpenHimHeaders = Record<string, string>;

export type OpenHimRequestDefinition = {
  path: string;
  headers: OpenHimHeaders;
  querystring: string;
  body: string;
  method: string;
  timestamp: Date;
};

export type OpenHimResponseDefinition = {
  status: number;
  headers: OpenHimHeaders;
  body: string;
  timestamp: Date;
};

export type OpenHimOrchestration = {
  name: string;
  request: OpenHimRequestDefinition;
  response?: OpenHimResponseDefinition;
};

export type OpenHimStatus =
  | 'Processing'
  | 'Failed'
  | 'Completed'
  | 'Successful'
  | 'Completed with error(s)';

export type OpenHimError = {
  message: string;
  stack: string;
};

export type OpenHimResponse = {
  'x-mediator-urn': string;
  status: OpenHimStatus;
  response: OpenHimResponseDefinition;
  orchestrations?: OpenHimOrchestration[];
  properties?: Record<string, string>;
  error?: OpenHimError;
};
