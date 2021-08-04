import { BaseLedgerEntry } from "./base_ledger_entry";

export interface Ticket extends BaseLedgerEntry {
    LedgerEntryType: "Ticket"
    Account: string
    Flags: number
    OwnerNode: string
    PreviousTxnID: string
    PreviousTxnLgrSeq: number
    TicketSequence: number
}