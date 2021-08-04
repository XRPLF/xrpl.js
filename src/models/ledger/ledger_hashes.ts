import { BaseLedgerEntry } from "./base_ledger_entry";

export interface LedgerHashes extends BaseLedgerEntry {
    LedgerEntryType: 'LedgerHashes'
    LastLedgerSequence?: number
    Hashes: string[]
    Flags: number
  }