import { Transaction } from '../transactions'
import TransactionMetadata from '../transactions/metadata'

import { BaseRequest, BaseResponse } from './baseMethod'

export interface TxRequest extends BaseRequest {
  command: 'tx'
  transaction: string
  binary?: boolean
  min_ledger?: number
  max_ledger?: number
}

export interface TxResponse extends BaseResponse {
  result: {
    hash: string
    ledger_index?: number
    meta?: TransactionMetadata | string
    validated?: boolean
  } & Transaction
  searched_all?: boolean
}
