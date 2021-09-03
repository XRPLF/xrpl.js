import { LedgerIndex } from '../common'
import { AccountRoot, SignerList } from '../ledger'

import { BaseRequest, BaseResponse } from './baseMethod'

export interface AccountInfoRequest extends BaseRequest {
  command: 'account_info'
  account: string
  ledger_hash?: string
  ledger_index?: LedgerIndex
  queue?: boolean
  signer_lists?: boolean
  strict?: boolean
}

interface QueueTransaction {
  auth_change: boolean
  fee: string
  fee_level: string
  max_spend_drops: string
  seq: number
}

interface QueueData {
  txn_count: number
  auth_change_queued?: boolean
  lowest_sequence?: number
  highest_sequence?: number
  max_spend_drops_total?: string
  transactions?: QueueTransaction[]
}

export interface AccountInfoResponse extends BaseResponse {
  result: {
    account_data: AccountRoot
    signer_lists?: SignerList[]
    ledger_current_index?: number
    ledger_index?: number
    queue_data?: QueueData
    validated?: boolean
  }
}
