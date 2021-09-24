import { Amount, LedgerIndex, Path } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

interface SourceCurrencyAmount {
  currency: string
  issuer?: string
}

export interface RipplePathFindRequest extends BaseRequest {
  command: 'ripple_path_find'
  source_account: string
  destination_account: string
  destination_amount: Amount
  send_max?: Amount
  source_currencies?: SourceCurrencyAmount
  ledger_hash?: string
  ledger_index?: LedgerIndex
}

interface PathOption {
  paths_computed: Path[]
  source_amount: Amount
}

export interface RipplePathFindResponse extends BaseResponse {
  result: {
    alternatives: PathOption[]
    destination_account: string
    destination_currencies: string[]
    destination_amount: Amount
    full_reply?: boolean
    id?: number | string
    ledger_current_index?: number
    source_account: string
    validated: boolean
  }
}
