import { LedgerIndex } from '../common'
import { BaseRequest, BaseResponse } from './base_method';

export interface NoRippleCheckRequest extends BaseRequest {
  command: "noripple_check"
  account: string
  role: "gateway" | "user"
  transactions?: boolean
  ledger_hash?: string
  ledger_index?: LedgerIndex
}

export interface NoRippleCheckResponse extends BaseResponse {
  ledger_current_index: number
  problems: string[]
  transactions: any[] // TODO: fix once transaction objects are implemented
}
