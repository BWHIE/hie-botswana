export interface ITransaction {
  id: string;
  status: string;
  type: string;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: any;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
  metadata: {
    timestamp: string;
    duration: number;
    source: string;
    destination: string;
  };
}

export interface ITransactionService {
  createTransaction(transaction: Partial<ITransaction>): Promise<ITransaction>;
  updateTransaction(
    id: string,
    updates: Partial<ITransaction>
  ): Promise<ITransaction>;
  getTransaction(id: string): Promise<ITransaction>;
  listTransactions(filters?: Partial<ITransaction>): Promise<ITransaction[]>;
}
