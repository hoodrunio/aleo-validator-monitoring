import express from 'express';
// import RestApiService from './services/RestApiService.js';
import ValidatorService from './services/ValidatorService.js';
import BlockService from './services/BlockService.js';
import AlertService from './services/AlertService.js';
import ConsensusService from './services/ConsensusService.js';
import PrimaryService from './services/PrimaryService.js';
import api from './api/index.js';
import logger from './utils/logger.js';
import { sequelize, User, config, initDatabase } from './config/index.js';
// import { authMiddleware } from './api/middleware/auth.js';

const app = express();
let port = process.env.PORT ? parseInt(process.env.PORT) : 4000;

// Uygulama başlatıldığında bağlantıyı test et

logger.info(`Initializing AleoSDKService with URL: ${config.aleo.sdkUrl} and network type: ${config.aleo.networkType}`);
const aleoSDKService = new AleoSDKService(config.aleo.sdkUrl, config.aleo.networkType as 'mainnet' | 'testnet');
const snarkOSDBService = new SnarkOSDBService(config.database.url);
const validatorService = new ValidatorService(aleoSDKService, snarkOSDBService);
const blockService = new BlockService(aleoSDKService, snarkOSDBService);
const consensusService = new ConsensusService(aleoSDKService);
const primaryService = new PrimaryService(aleoSDKService);

logger.info(`ConsensusService initialized with URL: ${config.aleo.sdkUrl}`);

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 saniye

async function tryConnect(maxRetries = MAX_RETRIES, retryDelay = RETRY_DELAY) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await consensusService.testConnection();
      logger.info('Aleo ağına başarıyla bağlanıldı.');
      return;
    } catch (error) {
      logger.error(`Bağlantı denemesi ${attempt}/${maxRetries} başarısız oldu:`, error);
      if (error instanceof Error) {
        logger.error('Hata detayları:', error.message);
        logger.error('Hata yığını:', error.stack);
      }
      if (attempt < maxRetries) {
        logger.info(`${retryDelay / 1000} saniye sonra yeniden denenecek...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  logger.error('Maksimum yeniden deneme sayısına ulaşıldı. Uygulama sonlandırılıyor.');
  process.exit(1);
}

function startServer() {
  app.listen(port, () => {
    logger.info(`Sunucu ${port} portunda çalışyor`);
  }).on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.warn(`${port} portu zaten kullanımda. Farklı bir port denenecek.`);
      port++;
      startServer();
    } else {
      logger.error('Sunucu başlatılırken hata oluştu:', error);
    }
  });
}

async function main() {
  try {
    await initDatabase();
    await snarkOSDBService.initializeDatabase();
    await tryConnect();
    startServer();

    // Periyodik validator güncellemesi
    setInterval(async () => {
      await validatorService.updateValidators();
    }, 60 * 60 * 1000); // Her saat başı

    // İlk validator güncellemesini hemen yap
    await validatorService.updateValidators();

    // Periyodik blok senkronizasyonu
    setInterval(async () => {
      await blockService.syncBlocks();
    }, 5 * 60 * 1000); // Her 5 dakikada bir

    // İlk blok senkronizasyonunu hemen yap
    await blockService.syncBlocks();

  } catch (error) {
    logger.error('Uygulama başlatılırken hata oluştu:', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Beklenmeyen bir hata oluştu:', error);
  process.exit(1);
});

app.use('/api', api(validatorService, blockService));

app.get('/api/validators', async (req, res) => {
  try {
    const validators = await snarkOSDBService.getValidators();
    res.json(validators);
  } catch (error) {
    logger.error('Validator bilgileri alınırken hata oluştu:', error);
    res.status(500).json({ error: 'Validator bilgileri alınamadı' });
  }
});

app.get('/api/consensus/round', async (req, res) => {
  try {
    const currentRound = await consensusService.getCurrentRound();
    if (currentRound === null) {
      res.status(404).json({ error: 'Mevcut tur hesaplanamadı' });
    } else {
      res.json({ currentRound });
    }
  } catch (error) {
    logger.error('Mevcut tur alınırken hata:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu' });
  }
});

app.get('/api/consensus/committee', async (req, res) => {
  try {
    logger.info('/api/consensus/committee için istek alındı');
    const committee = await consensusService.getCommittee();
    logger.info('Komite başarıyla alındı');
    res.json({ committee });
  } catch (error) {
    logger.error('Komite endpoint hatası:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: `Komite alınamadı: ${error.message}` });
    } else {
      res.status(500).json({ error: 'Komite alınamadı: Bilinmeyen bir hata oluştu' });
    }
  }
});

app.get('/api/primary/transmissions', async (req, res) => {
  try {
    const transmissions = await primaryService.collectTransmissions();
    res.json({ transmissions });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Bilinmeyen bir hata oluştu' });
    }
  }
});

// Test rotaları
app.get('/api/test/latest-block', async (req, res) => {
  try {
    const latestBlock = await aleoSDKService.getLatestBlock();
    res.json(latestBlock);
  } catch (error) {
    logger.error('Latest block fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch latest block' });
  }
});

app.get('/api/test/latest-committee', async (req, res) => {
  try {
    const latestCommittee = await aleoSDKService.getLatestCommittee();
    res.json(latestCommittee);
  } catch (error) {
    logger.error('Error fetching latest committee:', error);
    res.status(500).json({ error: 'Failed to fetch latest committee' });
  }
});

app.get('/api/test/block/:height', async (req, res) => {
  try {
    const height = parseInt(req.params.height);
    const block = await aleoSDKService.getBlock(height);
    res.json(block);
  } catch (error) {
    logger.error(`Error fetching block at height ${req.params.height}:`, error);
    res.status(500).json({ error: `Failed to fetch block at height ${req.params.height}` });
  }
});

app.get('/api/test/transaction/:id', async (req, res) => {
  try {
    const transaction = await aleoSDKService.getTransaction(req.params.id);
    res.json(transaction);
  } catch (error) {
    logger.error(`Error fetching transaction with id ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to fetch transaction with id ${req.params.id}` });
  }
});

app.get('/api/test/transactions/:height', async (req, res) => {
  try {
    const height = parseInt(req.params.height);
    const transactions = await aleoSDKService.getTransactions(height);
    res.json(transactions);
  } catch (error) {
    logger.error(`Error fetching transactions for block height ${req.params.height}:`, error);
    res.status(500).json({ error: `Failed to fetch transactions for block height ${req.params.height}` });
  }
});

// Veritabanı kullanımı örneği
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    logger.error('Kullanıcılar alınırken hata oluştu:', error);
    res.status(500).json({ error: 'Kullanıcılar alınamadı' });
  }
});

// Mevcut importların altına ekleyin
import AleoSDKService from './services/AleoSDKService.js';

// Diğer route'ların altına ekleyin
app.get('/api/test/latest-block-structure', async (req, res) => {
  try {
    const latestBlock = await aleoSDKService.getLatestBlock();
    res.json(latestBlock);
  } catch (error) {
    logger.error('Error fetching latest block structure:', error);
    res.status(500).json({ error: 'Failed to fetch latest block structure' });
  }
});

// Diğer import'larn yanına ekleyin
import { SnarkOSDBService } from './services/SnarkOSDBService.js';

// Diğer route'ların yanına ekleyin
app.get('/api/test/database', async (req, res) => {
  try {
    const snarkOSDBService = new SnarkOSDBService(config.database.url);
    await snarkOSDBService.testDatabaseOperations();
    res.json({ message: 'Veritabanı test işlemleri tamamlandı. Logları kontrol edin.' });
  } catch (error) {
    logger.error('Veritabanı test endpoint hatası:', error);
    res.status(500).json({ error: 'Veritabanı test işlemleri sırasında hata oluştu' });
  }
});

// Raw latest block endpoint
app.get('/api/test/raw-latest-block', async (req, res) => {
  try {
    const latestBlock = await aleoSDKService.getRawLatestBlock();
    res.json(latestBlock);
  } catch (error) {
    logger.error('Raw latest block fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch raw latest block' });
  }
});