import BaseLedgerEntry from './BaseLedgerEntry'

export interface NFToken {
  Flags: number
  Issuer: string
  NFTokenID: string
  NFTokenTaxon: number
  URI?: string
}

export interface NFTokenWrapper {
  NFToken: NFToken
}

export interface NFTokenPage extends BaseLedgerEntry {
  LedgerEntryType: 'NFTokenPage'
  NextPageMin?: string
  NFTokens: NFTokenWrapper[]
  PreviousPageMin?: string
  PreviousTxnID?: string
  PreviousTxnLgrSeq?: number
}
