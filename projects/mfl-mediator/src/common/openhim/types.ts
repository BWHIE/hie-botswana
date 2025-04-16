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
