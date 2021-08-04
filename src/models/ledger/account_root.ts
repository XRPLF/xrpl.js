import { BaseLedgerEntry } from "./base_ledger_entry";

export interface AccountRoot extends BaseLedgerEntry{
    LedgerEntryType: 'AccountRoot'
    Account: string
    Balance: string
    Flags: number
    OwnerCount: number
    PreviousTxnID: string
    PreviousTxnLgrSeq: number
    Sequence: number
    AccountTxnID?: string
    Domain?: string
    EmailHash?: string
    MessageKey?: string
    RegularKey?: string
    TicketCount?: number
    TickSize?: number
    TransferRate?: number
  }