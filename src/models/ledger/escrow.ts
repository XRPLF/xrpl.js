export interface Escrow {
    LedgerEntryType: 'Escrow'
    Account: string
    Destination: string
    Amount: string
    Condition?: string
    CancelAfter?: number
    FinishAfter?: number
    Flags: number
    SourceTag?: number
    DestinationTag?: number
    OwnerNode: string
    DestinationNode?: string
    PreviousTxnID: string
    PreviousTxnLgrSeq: number
  }