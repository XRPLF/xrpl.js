import { Balance, LedgerIndex } from '../common'
import { BaseRequest, BaseResponse } from './base_method';

export interface GatewayBalancesRequest extends BaseRequest {
  command: "gateway_balances"
  account: string
  strict?: boolean
  hotwallet: string | string[]
  ledger_hash?: string
  ledger_index?: LedgerIndex
}

export interface GatewayBalancesResponse extends BaseResponse {
  account: string
  obligations?: {[currency: string]: string}
  balances?: {[address: string]: Balance[]}
  assets?: {[address: string]: Balance[]}
  ledger_hash?: string
  ledger_current_index?: number
  ledger_index?: number
}
