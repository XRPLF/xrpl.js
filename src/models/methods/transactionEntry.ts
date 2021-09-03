import { LedgerIndex } from '../common'
import { Transaction } from '../transactions'
import TransactionMetadata from '../transactions/metadata'

import { BaseRequest, BaseResponse } from './baseMethod'

export interface TransactionEntryRequest extends BaseRequest {
  command: 'transaction_entry'
  ledger_hash?: string
  ledger_index?: LedgerIndex
  tx_hash: string
}

export interface TransactionEntryResponse extends BaseResponse {
  result: {
    ledger_hash: string
    ledger_index: number
    metadata: TransactionMetadata
    tx_json: Transaction
  }
}
