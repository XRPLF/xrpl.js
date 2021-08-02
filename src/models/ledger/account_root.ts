export interface AccountRoot {
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