import pg from 'pg';
import logger from '../utils/logger.js';
import { Block } from '../types/Block.js';

const { Pool: PgPool } = pg;

export class SnarkOSDBService {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new PgPool({ connectionString });
  }

  async initializeDatabase(): Promise<void> {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS validators (
          address TEXT PRIMARY KEY,
          stake BIGINT,
          is_active BOOLEAN,
          bonded BIGINT,
          last_seen TIMESTAMP,
          total_blocks_produced INTEGER DEFAULT 0,
          total_rewards BIGINT DEFAULT 0
        );
  
        ALTER TABLE validators ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
        ALTER TABLE validators ADD COLUMN IF NOT EXISTS bonded BIGINT;
  
        CREATE TABLE IF NOT EXISTS blocks (
          height BIGINT PRIMARY KEY,
          hash TEXT NOT NULL,
          previous_hash TEXT,
          timestamp BIGINT NOT NULL,
          transactions_count INT NOT NULL,
          validator_address TEXT,
          total_fees BIGINT
        );
      `);
      console.log("Database tables successfully created and updated");
    } catch (error) {
      console.error("Database initialization error:", error);
      throw error;
    }
  }

  async getValidators(): Promise<any[]> {
    try {
      const result = await this.pool.query('SELECT * FROM validators');
      return result.rows;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`SnarkOS DB getValidators error: ${error.message}`);
      }
      throw new Error('SnarkOS DB getValidators error: An unknown error occurred');
    }
  }

  async getBlocksByValidator(validatorAddress: string, limit: number): Promise<any[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM blocks WHERE validator_address = $1 ORDER BY height DESC LIMIT $2',
        [validatorAddress, limit]
      );
      return result.rows;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`SnarkOS DB getBlocksByValidator error: ${error.message}`);
      }
      throw new Error('SnarkOS DB getBlocksByValidator error: An unknown error occurred');
    }
  }

  async insertBlock(block: Block): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO blocks (height, hash, previous_hash, timestamp, transactions_count) VALUES ($1, $2, $3, $4, $5)',
        [block.height, block.hash, block.previous_hash, block.timestamp, block.transactions.length]
      );
      if (block.validator_address && block.total_fees) {
        await client.query(
          'UPDATE validators SET total_blocks_produced = total_blocks_produced + 1, total_rewards = total_rewards + $1, last_seen = $2 WHERE address = $3',
          [block.total_fees.toString(), block.timestamp, block.validator_address]
        );
      }
      await client.query('COMMIT');
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      if (error instanceof Error) {
        throw new Error(`SnarkOS DB insertBlock error: ${error.message}`);
      }
      throw new Error('SnarkOS DB insertBlock error: An unknown error occurred');
    } finally {
      client.release();
    }
  }

  async insertTransaction(transaction: any): Promise<void> {
    try {
      await this.pool.query(
        'INSERT INTO transactions (id, block_height, fee, timestamp) VALUES ($1, $2, $3, $4)',
        [transaction.id, transaction.block_height, transaction.fee, transaction.timestamp]
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`SnarkOS DB insertTransaction error: ${error.message}`);
      }
      throw new Error('SnarkOS DB insertTransaction error: An unknown error occurred');
    }
  }

  async updateValidator(address: string, stake: bigint): Promise<void> {
    try {
      await this.pool.query(
        'INSERT INTO validators (address, stake, last_seen, total_blocks_produced, total_rewards) VALUES ($1, $2, NOW(), 0, 0) ON CONFLICT (address) DO UPDATE SET stake = $2, last_seen = NOW()',
        [address, stake]
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`SnarkOS DB updateValidator error: ${error.message}`);
      }
      throw new Error('SnarkOS DB updateValidator error: An unknown error occurred');
    }
  }

  async executeQuery(query: string, params: any[] = []): Promise<any> {
    return this.pool.query(query, params);
  }

  public async query(sql: string, params?: any[]): Promise<{ rows: any[] }> {
    try {
      const result = await this.pool.query(sql, params);
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Query error:', error.message);
        throw new Error(`Database query failed: ${error.message}`);
      }
      console.error('Query error: An unknown error occurred');
      throw new Error('Database query failed: An unknown error occurred');
    }
  }

  async monitorValidatorPerformance(address: string, timeWindow: number): Promise<{
    blocksProduced: number,
    totalRewards: bigint,
    averageBlockTime: number
  }> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - timeWindow * 1000);

    const blocks = await this.query(
      'SELECT * FROM blocks WHERE validator_address = $1 AND timestamp BETWEEN $2 AND $3 ORDER BY height',
      [address, startTime, endTime]
    );

    const blocksProduced = blocks.rows.length;
    const totalRewards = blocks.rows.reduce((sum, block) => sum + BigInt(block.total_fees), BigInt(0));

    let averageBlockTime = 0;
    if (blocksProduced > 1) {
      const totalTime = blocks.rows[blocksProduced - 1].timestamp.getTime() - blocks.rows[0].timestamp.getTime();
      averageBlockTime = totalTime / (blocksProduced - 1);
    }

    return { blocksProduced, totalRewards, averageBlockTime };
  }

  async getLatestBlockHeight(): Promise<number> {
    try {
      const result = await this.pool.query('SELECT MAX(height) as max_height FROM blocks');
      return result.rows[0].max_height || 0;
    } catch (error) {
      logger.error('Error getting latest block height:', error);
      throw error;
    }
  }

  async saveBlocks(blocks: any[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const block of blocks) {
        await client.query(
          'INSERT INTO blocks (height, hash, previous_hash, timestamp, data) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (height) DO NOTHING',
          [block.height, block.hash, block.previous_hash, block.timestamp, JSON.stringify(block.data)]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error saving blocks:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async testDatabaseOperations(): Promise<void> {
    try {
      // Adding test validator
      const testValidator = {
        address: 'test_address',
        stake: BigInt(1000),
        last_seen: new Date(),
        total_blocks_produced: 0,
        total_rewards: BigInt(0)
      };
      await this.updateValidator(testValidator.address, testValidator.stake);
      logger.info('Test validator added successfully');

      // Adding test block
      const testBlock: Block = {
        height: 999999,
        hash: 'test_hash',
        previous_hash: 'test_previous_hash',
        timestamp: new Date().toISOString(),
        transactions: [],
        validator_address: 'test_address',
        total_fees: BigInt(100)
      };
      await this.insertBlock(testBlock);
      logger.info('Test block added successfully');

      // Fetching added data
      const result = await this.query('SELECT * FROM blocks WHERE height = $1', [999999]);
      logger.info('Fetched test block:', result.rows[0]);

      // Deleting test data
      await this.query('DELETE FROM blocks WHERE height = $1', [999999]);
      await this.query('DELETE FROM validators WHERE address = $1', ['test_address']);
      logger.info('Test data deleted');
    } catch (error) {
      logger.error('Error during database test operations:', error);
    }
  }

  async updateValidatorBlockProduction(address: string, blockReward: bigint): Promise<void> {
    try {
      await this.pool.query(
        'UPDATE validators SET total_blocks_produced = total_blocks_produced + 1, total_rewards = total_rewards + $1, last_seen = NOW() WHERE address = $2',
        [blockReward.toString(), address] // convert bigint to string
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`SnarkOS DB updateValidatorBlockProduction error: ${error.message}`);
      }
      throw new Error('SnarkOS DB updateValidatorBlockProduction error: An unknown error occurred');
    }
  }
}

export default SnarkOSDBService;