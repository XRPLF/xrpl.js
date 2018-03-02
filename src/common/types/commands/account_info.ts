import {AccountRoot, SignerList} from '../objects'

export interface AccountInfoRequest {
  account: string,
  strict?: boolean,
  queue?: boolean,
  ledger_hash?: string,
  ledger_index?: number | ('validated' | 'closed' | 'current'),
  signer_lists?: boolean
}

export interface AccountInfoResponse {
  account_data: AccountRoot,
  signer_lists?: SignerList[],
  ledger_current_index?: number,
  ledger_index?: number,
  queue_data?: QueueData,
  validated?: boolean
}

export interface QueueData {
  txn_count: number,
  auth_change_queued?: boolean,
  lowest_sequence?: number,
  highest_sequence?: number,
  max_spend_drops_total?: string,
  transactions?: TransactionData[]
}

export interface TransactionData {
  auth_change?: boolean,
  fee?: string,
  fee_level?: string,
  max_spend_drops?: string,
  seq?: number
}
