import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../index';

export class Block extends Model {
  public height!: number;
  public hash!: string;
  public validator_address!: string;
  public timestamp!: Date;
  public transactions_count!: number;
  public total_fees!: bigint;
}

Block.init({
  height: {
    type: DataTypes.BIGINT,
    primaryKey: true,
  },
  hash: {
    type: DataTypes.STRING,
    unique: true,
  },
  validator_address: DataTypes.STRING,
  timestamp: DataTypes.DATE,
  transactions_count: DataTypes.INTEGER,
  total_fees: DataTypes.BIGINT,
}, {
  sequelize,
  modelName: 'Block',
});