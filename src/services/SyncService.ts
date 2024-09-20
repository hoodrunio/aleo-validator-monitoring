import { AleoSDKService } from './AleoSDKService.js';
import { SnarkOSDBService } from './SnarkOSDBService.js';
import logger from '../utils/logger.js';

export class SyncService {
  constructor(
    private aleoSDKService: AleoSDKService, 
    private snarkOSDBService: SnarkOSDBService
  ) {}

  async syncLatestBlocks(count: number = 100): Promise<void> {
    const startTime = Date.now();
    try {
      const latestBlockHeight = await this.aleoSDKService.getLatestBlockHeight();
      if (latestBlockHeight === null) {
        throw new Error('Failed to get latest block height');
      }

      const startHeight = Math.max(0, latestBlockHeight - count + 1);
      logger.info(`Starting synchronization from block ${startHeight} to ${latestBlockHeight}`);

      const blocks = [];
      for (let height = startHeight; height <= latestBlockHeight; height++) {
        const block = await this.aleoSDKService.getBlockByHeight(height);
        if (block) {
          blocks.push(block);
          if (blocks.length % 10 === 0) {
            logger.debug(`Fetched ${blocks.length} blocks`);
          }
        } else {
          logger.warn(`Failed to fetch block at height ${height}`);
        }
      }

      if (blocks.length > 0) {
        await this.snarkOSDBService.saveBlocks(blocks);
        logger.info(`Successfully synced ${blocks.length} blocks`);
      } else {
        logger.warn('No blocks to synchronize');
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      logger.info(`Synchronization completed in ${duration} seconds`);
    } catch (error) {
      logger.error('Error during block synchronization:', error);
      throw error;
    }
  }
}