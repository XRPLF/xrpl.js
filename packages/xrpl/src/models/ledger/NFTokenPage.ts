import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface NFToken {
  NFToken: {
    NFTokenID: string
    URI?: string
    // Not stored on the ledger; decode them from NFTokenID with parseNFTokenID.
    Flags?: number
    Issuer?: string
    NFTokenTaxon?: number
  }
}

export interface NFTokenPage extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'NFTokenPage'
  NextPageMin?: string
  NFTokens: NFToken[]
  PreviousPageMin?: string
}
