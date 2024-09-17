import { AleoSDKService } from './AleoSDKService';
import { RestApiService } from './RestApiService';
import { SnarkOSDBService } from './SnarkOSDBService';

export class ValidatorService {
  constructor(
    private aleoSDKService: AleoSDKService,
    private restApiService: RestApiService,
    public snarkOSDBService: SnarkOSDBService
  ) {}

  async updateValidators(): Promise<void> {
    try {
      const committee = await this.restApiService.getLatestCommittee();
      const dbValidators = await this.snarkOSDBService.getValidators();
      for (const validator of committee) {
        const dbValidator = dbValidators.find((v: { address: string }) => v.address === validator.address);
        if (dbValidator) {
          await this.snarkOSDBService.executeQuery(
            'UPDATE validators SET stake = $1, last_seen = NOW() WHERE address = $2',
            [validator.stake, validator.address]
          );
        } else {
          await this.snarkOSDBService.executeQuery(
            'INSERT INTO validators (address, stake, last_seen) VALUES ($1, $2, NOW())',
            [validator.address, validator.stake]
          );
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Doğrulayıcı güncelleme hatası: ${error.message}`);
      } else {
        throw new Error('Doğrulayıcı güncelleme sırasında bilinmeyen bir hata oluştu');
      }
    }
  }

  async getValidatorPerformance(address: string): Promise<any> {
    try {
      const validator = await this.snarkOSDBService.executeQuery(
        'SELECT * FROM validators WHERE address = $1',
        [address]
      );
      if (validator.rows.length === 0) {
        throw new Error('Doğrulayıcı bulunamadı');
      }

      const recentBlocks = await this.snarkOSDBService.getBlocksByValidator(address, 100);
      
      const performance = {
        blocksProduced: recentBlocks.length,
        averageBlockTime: this.calculateAverageBlockTime(recentBlocks),
        totalFees: this.calculateTotalFees(recentBlocks),
        totalBlocksProduced: validator.rows[0].total_blocks_produced,
        totalRewards: validator.rows[0].total_rewards
      };

      return { validator: validator.rows[0], performance };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Doğrulayıcı performans hesaplama hatası: ${error.message}`);
      } else {
        throw new Error('Doğrulayıcı performans hesaplama sırasında bilinmeyen bir hata oluştu');
      }
    }
  }

  private calculateAverageBlockTime(blocks: any[]): number {
    if (blocks.length < 2) return 0;
    const timeDiffs = blocks.slice(1).map((block, index) => 
      new Date(block.timestamp).getTime() - new Date(blocks[index].timestamp).getTime()
    );
    return timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
  }

  private calculateTotalFees(blocks: any[]): bigint {
    return blocks.reduce((sum, block) => sum + BigInt(block.total_fees), BigInt(0));
  }
}