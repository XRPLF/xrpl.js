import { BaseLedgerEntry } from "./base_ledger_entry";

interface Majority {
  Majority: {
    Amendment: string
    CloseTime: number
  }
}

export interface Amendments extends BaseLedgerEntry {
  LedgerEntryType: 'Amendments'
  Amendments?: string[]
  Majorities?: Majority[]
  Flags: 0
}