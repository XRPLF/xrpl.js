import BaseLedgerEntry from './BaseLedgerEntry'

export interface NFToken {
  NFToken: {
    Flags: number
    Issuer: string
    NFTokenID: string
    NFTokenTaxon: number
    URI?: string
  }
}

export interface NFTokenPage extends BaseLedgerEntry {
  LedgerEntryType: 'NFTokenPage'
  NextPageMin?: string
  NFTokens: NFToken[]
  PreviousPageMin?: string
  PreviousTxnID?: string
  PreviousTxnLgrSeq?: number
}
