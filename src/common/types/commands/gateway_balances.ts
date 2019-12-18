import {Amount} from '../objects'

export interface GatewayBalancesRequest {
  account: string
  strict?: boolean
  hotwallet: string | Array<string>
  ledger_hash?: string
  ledger_index?: number | ('validated' | 'closed' | 'current')
}

export interface GatewayBalancesResponse {
  account: string
  obligations?: {[currency: string]: string}
  balances?: {[address: string]: Amount[]}
  assets?: {[address: string]: Amount[]}
  ledger_hash?: string
  ledger_current_index?: number
  ledger_index?: number
}
