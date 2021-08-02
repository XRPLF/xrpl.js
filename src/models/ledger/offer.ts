import { Amount } from "../common";

export interface Offer {
    LedgerEntryType: 'Offer'
    Flags: number
    Account: string
    Sequence: number
    TakerPays: Amount
    TakerGets: Amount
    BookDirectory: string
    BookNode: string
    OwnerNode: string
    PreviousTxnID: string
    PreviousTxnLgrSeq: number
    Expiration?: number
  }