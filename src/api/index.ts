import express from 'express';
import validatorRoutes from './routes/validators.js';
import blockRoutes from './routes/blocks.js';
import { ValidatorService } from '../services/ValidatorService.js';
import { BlockService } from '../services/BlockService.js';
import { errorHandler } from './middleware/errorHandler.js';

const router = express.Router();

export default (validatorService: ValidatorService, blockService: BlockService) => {
  router.use('/validators', validatorRoutes(validatorService));
  router.use('/blocks', blockRoutes(blockService));
  router.use(errorHandler);
  return router;
};