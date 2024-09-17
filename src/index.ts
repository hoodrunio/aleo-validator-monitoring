import express from 'express';
import { AleoSDKService } from './services/AleoSDKService';
import { RestApiService } from './services/RestApiService';
import { SnarkOSDBService } from './services/SnarkOSDBService';
import { ValidatorService } from './services/ValidatorService';
import { BlockService } from './services/BlockService';
import { AlertService } from './services/AlertService';
import { ConsensusService } from './services/ConsensusService';
import { PrimaryService } from './services/PrimaryService';
import api from './api';
import config from './config';
import logger from './utils/logger';
import { authMiddleware } from './api/middleware/auth';

const app = express();

app.use(express.json());
app.use(authMiddleware);

const aleoSDKService = new AleoSDKService(config.aleo.sdkUrl);
const restApiService = new RestApiService(config.aleo.sdkUrl);
const snarkOSDBService = new SnarkOSDBService(config.database.url);
const validatorService = new ValidatorService(aleoSDKService, restApiService, snarkOSDBService);
const blockService = new BlockService(aleoSDKService, snarkOSDBService);
const alertService = new AlertService(snarkOSDBService);
const consensusService = new ConsensusService(config.aleo.sdkUrl);
const primaryService = new PrimaryService(config.aleo.sdkUrl);

app.use('/api', api(validatorService, blockService));

app.get('/api/consensus/round', async (req, res) => {
  try {
    const currentRound = await consensusService.getCurrentRound();
    res.json({ currentRound });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Bilinmeyen bir hata oluştu' });
    }
  }
});

app.get('/api/consensus/committee', async (req, res) => {
  try {
    const committee = await consensusService.getCommittee();
    res.json({ committee });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Bilinmeyen bir hata oluştu' });
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

app.listen(config.api.port, () => {
  logger.info(`Server running on port ${config.api.port}`);
});