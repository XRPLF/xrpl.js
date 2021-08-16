import { LedgerIndex } from "../common";
import Metadata from "../common/metadata";
import { BaseRequest, BaseResponse } from "./baseMethod";

export interface AccountTxRequest extends BaseRequest {
  command: "account_tx"
  account: string
  ledger_index_min?: number
  ledger_index_max?: number
  ledger_hash?: string
  ledger_index?: LedgerIndex
  binary?: boolean
  forward?: boolean
  limit?: number
  marker?: any
}

interface AccountTransaction {
  ledger_index: number
  meta: string | Metadata
  tx?: any // TODO: replace when transaction objects are done
  tx_blob?: string
  validated: boolean
}

export interface AccountTxResponse extends BaseResponse {
  result: {
    account: string
    ledger_index_min: number
    ledger_index_max: number
    limit: number
    marker?: any
    transactions: AccountTransaction[]
    validated?: boolean
  }
}
