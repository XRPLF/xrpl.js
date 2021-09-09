import { LedgerData } from '../objects'

export interface LedgerDataRequest {
  id?: any
  ledger_hash?: string
  ledger_index?: string
  binary?: boolean
  limit?: number
  marker?: string
}

export type LedgerDataResponse = LedgerData
