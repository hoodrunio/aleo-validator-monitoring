import { AleoSDKService } from './AleoSDKService';
import { SnarkOSDBService } from './SnarkOSDBService';

export class BlockService {
  private aleoSDKService: AleoSDKService;

  constructor(
    aleoSDKService: AleoSDKService,
    private snarkOSDBService: SnarkOSDBService
  ) {
    this.aleoSDKService = aleoSDKService;
  }

  async syncLatestBlocks(): Promise<void> {
    try {
      const latestHeight = await this.aleoSDKService.getLatestBlockHeight();
      const currentHeight = await this.getCurrentHeight();
      const batchSize = 100; // Aynı anda işlenecek blok sayısı

      for (let startHeight = currentHeight + 1; startHeight <= latestHeight; startHeight += batchSize) {
        const endHeight = Math.min(startHeight + batchSize - 1, latestHeight);
        const blockPromises = [];

        for (let height = startHeight; height <= endHeight; height++) {
          blockPromises.push(this.aleoSDKService.getBlock(height));
        }

        const blocks = await Promise.all(blockPromises);
        await Promise.all(blocks.map(block => this.processBlock(block)));
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Blok senkronizasyon hatası: ${error.message}`);
      } else {
        throw new Error('Bilinmeyen bir hata oluştu');
      }
    }
  }

  private async getCurrentHeight(): Promise<number> {
    try {
      const result = await this.snarkOSDBService.query('SELECT MAX(height) as max_height FROM blocks');
      if (result instanceof Error) {
        throw result;
      }
      const maxHeight = result.rows[0]?.max_height;
      
      if (typeof maxHeight !== 'number' || isNaN(maxHeight)) {
        return 0; // Eğer geçerli bir yükseklik yoksa, 0 döndür
      }
      
      return maxHeight;
    } catch (error) {
      console.error('Yükseklik alınırken hata oluştu:', error);
      throw new Error('Blok yüksekliği alınamadı');
    }
  }

  private async processBlock(block: any): Promise<void> {
    const transactions = block.transactions || [];
    const totalFees = transactions.reduce((sum: bigint, tx: any) => sum + BigInt(tx.fee), BigInt(0));

    const processedBlock = {
      height: block.height,
      hash: block.hash,
      validator_address: block.validator,
      timestamp: new Date(block.timestamp),
      transactions_count: transactions.length,
      total_fees: totalFees.toString()
    };

    await this.snarkOSDBService.insertBlock(processedBlock);

    for (const tx of transactions) {
      await this.snarkOSDBService.insertTransaction({
        id: tx.id,
        block_height: block.height,
        fee: tx.fee,
        timestamp: new Date(tx.timestamp)
      });
    }
  }

  public async getLatestBlock() {
    const latestHeight = await this.aleoSDKService.getLatestBlockHeight();
    return this.aleoSDKService.getBlockByHeight(latestHeight);
  }

  public async getBlockByHeight(height: number) {
    return this.aleoSDKService.getBlockByHeight(height);
  }
}