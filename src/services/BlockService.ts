import { AleoSDKService } from './AleoSDKService.js';
import { SnarkOSDBService } from './SnarkOSDBService.js';
import logger from '../utils/logger.js';
import { Block } from '../types/Block.js';

export class BlockService {
  constructor(
    private aleoSDKService: AleoSDKService,
    private snarkOSDBService: SnarkOSDBService
  ) {}

  async syncBlocks(batchSize: number = 10): Promise<void> {
    try {
      const latestSyncedBlock = await this.snarkOSDBService.getLatestBlockHeight();
      const latestNetworkBlock = await this.getLatestBlock();
      
      console.log("En son senkronize edilen blok:", latestSyncedBlock);
      console.log("Ağdaki en son blok:", latestNetworkBlock);
      
      // ... mevcut senkronizasyon mantığı ...
    } catch (error) {
      console.error('Blok senkronizasyonu sırasında hata oluştu:', error);
    }
  }

  private async fetchBlockRange(startHeight: number, endHeight: number): Promise<Block[]> {
    const blocks: Block[] = [];
    for (let height = startHeight; height <= endHeight; height++) {
      try {
        const block = await this.aleoSDKService.getBlockByHeight(height);
        if (block) {
          blocks.push(block);
        } else {
          logger.warn(`Blok alınamadı: ${height}`);
        }
      } catch (error) {
        logger.error(`${height} yüksekliğindeki blok alınırken hata oluştu:`, error);
      }
    }
    return blocks;
  }

  async getLatestBlock() {
    try {
      const latestHeight = await this.aleoSDKService.getLatestBlockHeight();
      if (latestHeight === null) {
        throw new Error('En son blok yüksekliği alınamadı');
      }
      return this.aleoSDKService.getBlockByHeight(latestHeight);
    } catch (error) {
      logger.error('En son blok alınırken hata oluştu:', error);
      throw error;
    }
  }

  public async getBlockByHeight(height: number) {
    return this.aleoSDKService.getBlockByHeight(height);
  }
}

export default BlockService;
