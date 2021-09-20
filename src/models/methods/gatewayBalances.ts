import { LedgerIndex } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

export interface GatewayBalancesRequest extends BaseRequest {
  command: 'gateway_balances'
  account: string
  strict?: boolean
  hotwallet?: string | string[]
  ledger_hash?: string
  ledger_index?: LedgerIndex
}

interface Balance {
  currency: string
  value: string
}

export interface GatewayBalancesResponse extends BaseResponse {
  result: {
    account: string
    obligations?: { [currency: string]: string }
    balances?: { [address: string]: Balance[] }
    assets?: { [address: string]: Balance[] }
    ledger_hash?: string
    ledger_current_index?: number
    ledger_index?: number
  }
}
