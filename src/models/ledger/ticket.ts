export interface Ticket {
    LedgerEntryType: "Ticket"
    Account: string
    Flags: number
    OwnerNode: string
    PreviousTxnID: string
    PreviousTxnLgrSeq: number
    TicketSequence: number
}