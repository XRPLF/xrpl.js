import { Transaction } from '../transactions'

import LedgerEntry from './ledgerEntry'

export default interface Ledger {
  account_hash: string
  accountState?: LedgerEntry[]
  close_flags: number
  close_time: number
  close_time_human: string
  close_time_resolution: number
  closed: boolean
  ledger_hash: string
  ledger_index: string
  parent_close_time: number
  parent_hash: string
  total_coins: string
  transaction_hash: string
  transactions?: Transaction[]
}
