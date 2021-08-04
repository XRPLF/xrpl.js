import { BaseLedgerEntry } from "./base_ledger_entry";

interface SignerEntry {
  SignerEntry: {
    Account: string
    SignerWeight: number
  }
}

export interface SignerList extends BaseLedgerEntry {
  LedgerEntryType: 'SignerList'
  Flags: number
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
  OwnerNode: string
  SignerEntries: SignerEntry[]
  SignerListID: number
  SignerQuorum: number
}