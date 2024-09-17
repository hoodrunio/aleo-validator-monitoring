import { Sequelize } from 'sequelize';
import config from '../config';

export const sequelize = new Sequelize(config.database.url, {
  dialect: 'postgres',
  logging: false,
});

// Model ilişkilerini burada tanımlayın
import { Validator } from './models/Validator';
import { Block } from './models/Block';
import { Transaction } from './models/Transaction';

Block.belongsTo(Validator, { foreignKey: 'validator_address', as: 'validator' });
Validator.hasMany(Block, { foreignKey: 'validator_address', as: 'blocks' });

Transaction.belongsTo(Block, { foreignKey: 'block_height', as: 'block' });
Block.hasMany(Transaction, { foreignKey: 'block_height', as: 'transactions' });

export { Validator, Block, Transaction };