import { AleoNetworkClient } from '@aleohq/sdk';
import crypto from 'crypto';

interface Transmission {
  id: string;
  data: any;
}

export class PrimaryService {
  private networkClient: AleoNetworkClient;

  constructor(networkUrl: string) {
    this.networkClient = new AleoNetworkClient(networkUrl);
  }

  async collectTransmissions(): Promise<Transmission[]> {
    try {
      const mempoolTransactions = await this.networkClient.getTransactionsInMempool();
      if (mempoolTransactions instanceof Error) {
        throw mempoolTransactions;
      }
      return mempoolTransactions.map(tx => ({
        id: tx.id,
        data: tx // Tüm işlem verisini saklıyoruz
      }));
    } catch (error) {
      console.error('İletimler toplanırken hata oluştu:', error);
      throw new Error('İletimler toplanamadı');
    }
  }
}
