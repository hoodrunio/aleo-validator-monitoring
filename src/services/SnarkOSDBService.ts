import { Pool } from 'pg';

export class SnarkOSDBService {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async initializeDatabase(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS validators (
          address VARCHAR(255) PRIMARY KEY,
          stake BIGINT,
          last_seen TIMESTAMP,
          total_blocks_produced INT DEFAULT 0,
          total_rewards BIGINT DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS blocks (
          height BIGINT PRIMARY KEY,
          hash VARCHAR(255) UNIQUE,
          validator_address VARCHAR(255),
          timestamp TIMESTAMP,
          transactions_count INT,
          total_fees BIGINT,
          FOREIGN KEY (validator_address) REFERENCES validators(address)
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id VARCHAR(255) PRIMARY KEY,
          block_height BIGINT,
          fee BIGINT,
          timestamp TIMESTAMP,
          FOREIGN KEY (block_height) REFERENCES blocks(height)
        );

        CREATE INDEX IF NOT EXISTS idx_blocks_validator ON blocks(validator_address);
        CREATE INDEX IF NOT EXISTS idx_transactions_block ON transactions(block_height);
        CREATE INDEX IF NOT EXISTS idx_validators_stake ON validators(stake);
        CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp);
        CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
      `);
    } finally {
      client.release();
    }
  }

  async getValidators(): Promise<any[]> {
    try {
      const result = await this.pool.query('SELECT * FROM validators');
      return result.rows;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`SnarkOS DB getValidators hatası: ${error.message}`);
      }
      throw new Error('SnarkOS DB getValidators hatası: Bilinmeyen bir hata oluştu');
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
        throw new Error(`SnarkOS DB getBlocksByValidator hatası: ${error.message}`);
      }
      throw new Error('SnarkOS DB getBlocksByValidator hatası: Bilinmeyen bir hata oluştu');
    }
  }

  async insertBlock(block: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO blocks (height, hash, validator_address, timestamp, transactions_count, total_fees) VALUES ($1, $2, $3, $4, $5, $6)',
        [block.height, block.hash, block.validator_address, block.timestamp, block.transactions_count, block.total_fees]
      );
      await client.query(
        'UPDATE validators SET total_blocks_produced = total_blocks_produced + 1, total_rewards = total_rewards + $1, last_seen = $2 WHERE address = $3',
        [block.total_fees, block.timestamp, block.validator_address]
      );
      await client.query('COMMIT');
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      if (error instanceof Error) {
        throw new Error(`SnarkOS DB insertBlock hatası: ${error.message}`);
      }
      throw new Error('SnarkOS DB insertBlock hatası: Bilinmeyen bir hata oluştu');
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
        throw new Error(`SnarkOS DB insertTransaction hatası: ${error.message}`);
      }
      throw new Error('SnarkOS DB insertTransaction hatası: Bilinmeyen bir hata oluştu');
    }
  }

  async updateValidator(address: string, stake: bigint): Promise<void> {
    try {
      await this.pool.query(
        'INSERT INTO validators (address, stake, last_seen) VALUES ($1, $2, NOW()) ON CONFLICT (address) DO UPDATE SET stake = $2, last_seen = NOW()',
        [address, stake]
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`SnarkOS DB updateValidator hatası: ${error.message}`);
      }
      throw new Error('SnarkOS DB updateValidator hatası: Bilinmeyen bir hata oluştu');
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
        console.error('Sorgu hatası:', error.message);
        throw new Error(`Veritabanı sorgusu başarısız oldu: ${error.message}`);
      }
      console.error('Sorgu hatası: Bilinmeyen bir hata oluştu');
      throw new Error('Veritabanı sorgusu başarısız oldu: Bilinmeyen bir hata oluştu');
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
}