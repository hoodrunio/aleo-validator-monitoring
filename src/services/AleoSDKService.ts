import { AleoNetworkClient } from "@aleohq/sdk";

export class AleoSDKService {
  private client: AleoNetworkClient;

  constructor(host: string) {
    this.client = new AleoNetworkClient(host);
  }

  async getLatestBlockHeight(): Promise<number> {
    const result = await this.client.getLatestHeight();
    if (result instanceof Error) {
      throw result;
    }
    return result;
  }

  async getLatestBlock(): Promise<any> {
    return this.client.getLatestBlock();
  }

  async getLatestCommittee(): Promise<any> {
    return this.client.getLatestCommittee();
  }

  async getBlock(height: number): Promise<any> {
    return this.client.getBlock(height);
  }

  async getTransaction(id: string): Promise<any> {
    return this.client.getTransaction(id);
  }

  async getTransactions(height: number): Promise<any[]> {
    const result = await this.client.getTransactions(height);
    if (result instanceof Error) {
      throw result;
    }
    return result;
  }

  // Yeni eklenen metot
  async getBlockByHeight(height: number): Promise<any> {
    return this.getBlock(height);
  }
}
