export interface DepositPreauth {
    LedgerEntryType: 'DepositPreauth'
    Account: string
    Authorize: string
    Flags: 0
    OwnerNode: string
    PreviousTxnID: string
    PreviousTxnLgrSeq: number
  }