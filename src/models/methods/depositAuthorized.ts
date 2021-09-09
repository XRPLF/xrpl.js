import { LedgerIndex } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

export interface DepositAuthorizedRequest extends BaseRequest {
  command: 'deposit_authorized'
  source_account: string
  destination_account: string
  ledger_hash?: string
  ledger_index?: LedgerIndex
}

export interface DepositAuthorizedResponse extends BaseResponse {
  result: {
    deposit_authorized: boolean
    destination_account: string
    ledger_hash?: string
    ledger_index?: number
    ledger_current_index?: number
    source_account: string
    validated?: boolean
  }
}
