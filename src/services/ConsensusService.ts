import AleoSDKService from './AleoSDKService.js';
import logger from '../utils/logger.js';

class ConsensusService {
    constructor(private aleoSDKService: AleoSDKService) {}

    async testConnection(): Promise<void> {
        try {
            const latestHeight = await this.aleoSDKService.getLatestBlockHeight();
            if (latestHeight) {
                logger.info(`Bağlantı testi başarılı. En son blok yüksekliği: ${latestHeight}`);
            } else {
                throw new Error('Blok yüksekliği alınamadı');
            }
        } catch (error) {
            logger.error('Bağlantı testi sırasında hata:', error);
            if (error instanceof Error) {
                throw new Error(`Aleo ağına bağlanılamadı: ${error.message}`);
            } else {
                throw new Error('Aleo ağına bağlanılamadı: Bilinmeyen bir hata oluştu');
            }
        }
    }

    async getCurrentRound(): Promise<number | null> {
        try {
          const latestBlock = await this.aleoSDKService.getLatestBlock();
          if (!latestBlock) {
            logger.warn('En son blok alınamadı');
            return null;
          }
          logger.debug('En son blok:', JSON.stringify(latestBlock, (_, v) => typeof v === 'bigint' ? v.toString() : v));
          if (typeof latestBlock.height !== 'number' || isNaN(latestBlock.height)) {
            logger.warn(`Geçersiz blok yüksekliği: ${latestBlock.height}`);
            return null;
          }
          
          const blocksPerRound = 100; // Varsayılan değer, gerçek değeri projenize göre ayarlayın
          return Math.floor(latestBlock.height / blocksPerRound);
        } catch (error) {
          logger.error("getCurrentRound hatası:", error);
          return null;
        }
      }

    async getCommittee(): Promise<any> {
        try {
            return await this.aleoSDKService.getLatestCommittee();
        } catch (error) {
            logger.error('getCommittee hatası:', error);
            throw new Error('Komite alınamadı: ' + (error instanceof Error ? error.message : String(error)));
        }
    }
}
export default ConsensusService;

