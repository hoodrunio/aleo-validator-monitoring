import axios from 'axios';

export class RestApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getLatestCommittee(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/latest/committee`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`REST API getLatestCommittee hatası: ${error.message}`);
      } else {
        throw new Error('REST API getLatestCommittee hatası: Bilinmeyen bir hata oluştu');
      }
    }
  }

  async getMemoryPoolTransactions(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/memoryPool/transactions`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`REST API getMemoryPoolTransactions hatası: ${error.message}`);
      } else {
        throw new Error('REST API getMemoryPoolTransactions hatası: Bilinmeyen bir hata oluştu');
      }
    }
  }
}