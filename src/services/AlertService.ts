import { SnarkOSDBService } from './SnarkOSDBService.js';
import logger from '../utils/logger.js';

export class AlertService {
  constructor(private snarkOSDBService: SnarkOSDBService) {}

  async checkMissedBlocks(validatorAddress: string, threshold: number): Promise<boolean> {
    try {
      const recentBlocks = await this.snarkOSDBService.getBlocksByValidator(validatorAddress, 100);
      const missedBlocks = this.calculateMissedBlocks(recentBlocks);
      if (missedBlocks > threshold) {
        logger.warn(`Validator ${validatorAddress} missed ${missedBlocks} blocks, exceeding threshold of ${threshold}`);
        return true;
      }
      return false;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Error checking missed blocks for validator ${validatorAddress}: ${error.message}`);
      } else {
        logger.error(`Error checking missed blocks for validator ${validatorAddress}: Bilinmeyen hata`);
      }
      throw error;
    }
  }

  private calculateMissedBlocks(blocks: any[]): number {
    if (blocks.length < 2) return 0;
    let missedBlocks = 0;
    for (let i = 1; i < blocks.length; i++) {
      missedBlocks += blocks[i].height - blocks[i-1].height - 1;
    }
    return missedBlocks;
  }
}

export default AlertService;
