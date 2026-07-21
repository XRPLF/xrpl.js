import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface NFToken {
  NFToken: {
    Flags: number
    Issuer: string
    NFTokenID: string
    NFTokenTaxon: number
    URI?: string
  }
}

export interface NFTokenPage extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'NFTokenPage'
  NextPageMin?: string
  NFTokens: NFToken[]
  PreviousPageMin?: string
  /**
   * (Optional) The account sponsoring the reserve for this NFTokenPage. If
   * present, the sponsor is responsible for the reserve requirement of this
   * object instead of the owner.
   */
  Sponsor?: string
}
