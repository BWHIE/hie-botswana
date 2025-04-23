export interface OpenHIMTransaction {
  _id: string;
  status: string;
  response: {
    status: number;
    headers: Record<string, string>;
    body: string;
  };
  request: {
    path: string;
    querystring: string;
    headers: Record<string, string>;
    body: string;
  };
  clientID: string;
  route: string;
  startedAt: string;
  finishedAt: string;
}

export interface OpenHIMResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface OpenHIMRequest {
  path: string;
  querystring: string;
  headers: Record<string, string>;
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

export interface OpenHimConfig {
  username: string;
  password: string;
  apiURL: string;
  trustSelfSigned: boolean;
  rejectUnauthorized: boolean;
  urn: string;
}

export interface MediatorConfig {
  urn: string;
  version: string;
  name: string;
  description: string;
  defaultChannelConfig: any[];
  endpoints: any[];
}

export interface OpenHimHeaders {
  [key: string]: string;
}

export type OpenHimStatus = "Success" | "Failed" | "Processing";

export interface OpenHimOrchestration {
  name: string;
  request: {
    path: string;
    headers: OpenHimHeaders;
    querystring: string;
    body: any;
    method: string;
    timestamp: string;
  };
  response: {
    status: number;
    headers: OpenHimHeaders;
    body: any;
    timestamp: string;
  };
}

export interface OpenHimError {
  message: string;
  stack?: string;
}

export const OPENHIM_TRANSACTION_ID = "x-openhim-transactionid";

export type OpenHimResponse = {
  "x-mediator-urn": string;
  status: OpenHimStatus;
  response: {
    status: number;
    headers: OpenHimHeaders;
    body: string;
    timestamp: Date;
  };
  orchestrations?: OpenHimOrchestration[];
  properties?: Record<string, string>;
  error?: OpenHimError;
};
