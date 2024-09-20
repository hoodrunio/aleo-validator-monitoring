/* import axios from 'axios';
import logger from '../utils/logger.js';

export class RestApiService {
  constructor(private baseUrl: string) {}

  async getLatestCommittee() {
    try {
      const response = await axios.get(`${this.baseUrl}/latest/committee`);
      return response.data;
    } catch (error) {
      logger.error('REST API getLatestCommittee hatası:', error);
      throw new Error('REST API getLatestCommittee hatası: ' + (error instanceof Error ? error.message : String(error)));
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

export default RestApiService; */