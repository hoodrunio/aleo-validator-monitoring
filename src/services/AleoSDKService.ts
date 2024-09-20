import { AleoNetworkClient  } from '@provablehq/sdk';
import winston from 'winston';
import axios from 'axios';
import { Block, APIBlock } from '../types/Block.js';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

export class AleoSDKService {
  private network: AleoNetworkClient;

  constructor(networkUrl: string, networkType: 'mainnet' | 'testnet') {
    this.network = new AleoNetworkClient(networkUrl);
    logger.debug(`Network initialized with URL: ${networkUrl}`);
  }

  async getLatestBlock(): Promise<Block | null> {
    try {
      logger.debug('En son bloğu getirme işlemi başlatılıyor...');
      const latestBlock = await this.network.getLatestBlock();
      logger.debug('Ham API yanıtı:', JSON.stringify(latestBlock, null, 2));
      if (latestBlock) {
        const convertedBlock = this.convertApiBlockToBlock(latestBlock);
        logger.debug('Dönüştürülmüş en son blok:', JSON.stringify(convertedBlock, (_, v) => typeof v === 'bigint' ? v.toString() : v));
        return convertedBlock;
      } else {
        throw new Error('Geçersiz blok yapısı alındı');
      }
    } catch (error) {
      logger.error('getLatestBlock hatası:', error);
      return null;
    }
  }

  private convertApiBlockToBlock(apiBlock: any): Block {
    if (!apiBlock) {
      throw new Error('Geçersiz blok yapısı');
    }
    
    logger.debug('API Block:', JSON.stringify(apiBlock, null, 2));
    
    return {
      height: apiBlock.header?.metadata?.height ? Number(apiBlock.header.metadata.height) : undefined,
      hash: apiBlock.block_hash,
      previous_hash: apiBlock.previous_hash,
      timestamp: apiBlock.header?.metadata?.timestamp ? new Date(apiBlock.header.metadata.timestamp * 1000).toISOString() : undefined,
      transactions: apiBlock.transactions || [],
      validator_address: apiBlock.authority?.subdag?.subdag?.[Object.keys(apiBlock.authority.subdag.subdag)[0]]?.[0]?.batch_header?.author,
      total_fees: apiBlock.header?.metadata?.cumulative_weight ? BigInt(apiBlock.header.metadata.cumulative_weight) : undefined,
    };
  }

  async getLatestCommittee(): Promise<any> {
    try {
      return await this.network.getLatestCommittee();
    } catch (error) {
      logger.error('getLatestCommittee hatası:', error);
      throw error;
    }
  }

  async getTransactionsInMempool(): Promise<any[]> {
    try {
      const transactions = await this.network.getTransactionsInMempool();
      if (transactions instanceof Error) {
        throw transactions;
      }
      return transactions;
    } catch (error) {
      logger.error('getTransactionsInMempool hatası:', error);
      throw error;
    }
  }
  async getBlock(height: number): Promise<any> {
    try {
      logger.debug(`${height} yüksekliğindeki blok getiriliyor...`);
      const block = await this.network.getBlock(height);
      logger.debug(`Ham API yanıtı: ${JSON.stringify(block)}`);
      return block;
    } catch (error) {
      logger.error(`Error while fetching block at height ${height}:`, error);
      throw new Error(`Failed to get block at height ${height}`);
    }
  }

  async getTransaction(id: string) {
    try {
      logger.debug(`Fetching transaction with id ${id}...`);
      const transaction = await this.network.getTransaction(id);
      logger.debug(`Raw API response: ${JSON.stringify(transaction)}`);
      return transaction;
    } catch (error) {
      logger.error(`Error while fetching transaction with id ${id}:`, error);
      throw new Error(`Failed to get transaction with id ${id}`);
    }
  }

  async getTransactions(height: number) {
    try {
      logger.debug(`Fetching transactions for block height ${height}...`);
      const transactions = await this.network.getTransactions(height);
      logger.debug(`Raw API response: ${JSON.stringify(transactions)}`);
      return transactions;
    } catch (error) {
      logger.error(`Error while fetching transactions for block height ${height}:`, error);
      throw new Error(`Failed to get transactions for block height ${height}`);
    }
  }

  async getBlockByHeight(height: number): Promise<Block | null> {
    try {
      const apiBlock = await this.network.getBlock(height);
      if (apiBlock instanceof Error) {
        logger.error(`Error fetching block at height ${height}:`, apiBlock);
        return null;
      }
      return this.convertApiBlockToBlock(apiBlock);
    } catch (error) {
      logger.error(`Error while fetching block at height ${height}:`, error);
      return null;
    }
  }

  async getLatestBlockHeight(): Promise<number | null> {
    try {
      const latestHeight = await this.network.getLatestHeight();
      if (typeof latestHeight === 'number') {
        return latestHeight;
      } else {
        logger.warn('Beklenmeyen yanıt formatı:', latestHeight);
        return null;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Axios hatası:', error.message);
        logger.error('Yanıt durumu:', error.response?.status);
        logger.error('Yanıt verisi:', error.response?.data);
      } else {
        logger.error('Bilinmeyen hata:', error);
      }
      throw error;
    }
  }

  async getRawLatestBlock(): Promise<any> {
    try {
      const latestBlock = await this.network.getLatestBlock();
      logger.debug('Raw latest block:', JSON.stringify(latestBlock, null, 2));
      return latestBlock;
    } catch (error) {
      logger.error('getRawLatestBlock hatası:', error);
      throw error;
    }
  }
}

export default AleoSDKService;

