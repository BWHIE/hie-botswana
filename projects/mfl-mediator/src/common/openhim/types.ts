export interface OpenHIMTransaction {
  status: OpenHimStatus;
  request: {
    path: string;
    querystring: string;
    headers: OpenHimHeaders;
    body: string;
    timestamp: string;
  };
  response: {
    status: number;
    headers: OpenHimHeaders;
    body: string;
  };
  clientID: string;
  route: string;
  startedAt: string;
  finishedAt: string;
  properties?: Record<string, string>;
}

export interface OpenHIMResponse {
  status: number;
  headers: OpenHimHeaders;
  body: string;
}

export interface OpenHIMRequest {
  path: string;
  querystring: string;
  headers: OpenHimHeaders;
  body: string;
}

export interface OpenHIMConfig {
  username: string;
  password: string;
  apiURL: string;
  trustSelfSigned: boolean;
  clientID: string;
  clientPassword: string;
}

export interface OpenHIMTransactionResponse {
  transactionId: string;
  status: string;
  response: OpenHIMResponse;
}

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
  path: string;
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
  timestamp: string;
};

export type OpenHimResponseDefinition = {
  status: number;
  headers: OpenHimHeaders;
  body: string;
  timestamp: string;
};

export type OpenHimStatus =
  | "Processing"
  | "Failed"
  | "Completed"
  | "Successful"
  | "Completed with error(s)";

export type OpenHimOrchestration = {
  name: string;
  request: OpenHimRequestDefinition;
  response?: OpenHimResponseDefinition;
};

export type OpenHimError = {
  message: string;
  stack: string;
};

export type OpenHimResponse = {
  "x-mediator-urn": string;
  status: OpenHimStatus;
  response: OpenHimResponseDefinition;
  orchestrations?: OpenHimOrchestration[];
  properties?: Record<string, string>;
  error?: OpenHimError;
};

export const OPENHIM_TRANSACTION_ID = "x-openhim-transactionid";
