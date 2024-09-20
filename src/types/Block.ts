export interface Block {
  height: number | undefined;
  hash: string | undefined;
  previous_hash: string;
  timestamp: string | undefined;
  transactions: any[];
  validator_address: string | undefined;
  total_fees: bigint | undefined;
}

export interface APIBlock {
  height: number | string;
  hash: string;
  previous_hash: string;
  timestamp: string;
  transactions: any[];
  validator_address?: string;
  total_fees?: string | number;
}