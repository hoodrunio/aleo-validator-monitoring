import express from 'express';
import validatorRoutes from './routes/validators';
import blockRoutes from './routes/blocks';
import { ValidatorService } from '../services/ValidatorService';
import { BlockService } from '../services/BlockService';
import { errorHandler } from './middleware/errorHandler';

const router = express.Router();

export default (validatorService: ValidatorService, blockService: BlockService) => {
  router.use('/validators', validatorRoutes(validatorService));
  router.use('/blocks', blockRoutes(blockService));
  router.use(errorHandler);
  return router;
};