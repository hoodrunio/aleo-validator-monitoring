import Joi from 'joi';
import { Block } from '../types/Block';

const blockSchema = Joi.object({
  height: Joi.number().optional(),
  hash: Joi.string().optional(),
  previous_hash: Joi.string().required(),
  timestamp: Joi.string().isoDate().optional(),
  transactions: Joi.array().items(Joi.any()),
  validator_address: Joi.string().optional(),
  total_fees: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
});

export const validateBlock = (block: Block) => {
  return blockSchema.validate(block, { convert: false });
};