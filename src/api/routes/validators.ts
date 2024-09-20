import express from 'express';
import { ValidatorService } from '../../services/ValidatorService.js';

const router = express.Router();

export default (validatorService: ValidatorService) => {
  router.get('/', async (req, res) => {
    try {
      const validators = await validatorService.snarkOSDBService.getValidators();
      res.json(validators);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Bilinmeyen bir hata oluştu' });
      }
    }
  });

  router.get('/:address', async (req, res) => {
    try {
      const { address } = req.params;
      const performance = await validatorService.getValidatorPerformance(address);
      res.json(performance);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Doğrulayıcı bulunamadı') {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: 'Bilinmeyen bir hata oluştu' });
      }
    }
  });

  return router;
};