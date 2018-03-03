export interface QueueTransaction {
  auth_change: boolean,
  fee: string,
  fee_level: string,
  max_spend_drops: string,
  seq: number
}

export interface QueueData {
  txn_count: number,
  auth_change_queued?: boolean,
  lowest_sequence?: number,
  highest_sequence?: number,
  max_spend_drops_total?: string,
  transactions?: QueueTransaction[]
}
