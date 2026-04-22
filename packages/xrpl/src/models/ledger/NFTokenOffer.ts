import { Amount } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface NFTokenOffer extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'NFTokenOffer'
  Amount: Amount
  Destination?: string
  Expiration: number
  Flags: number
  NFTokenOfferNode?: string
  Owner: string
  OwnerNode?: string
  /**
   * The account sponsoring the reserve for this NFTokenOffer. If present, the
   * sponsor is responsible for the reserve requirement of this object instead
   * of the owner.
   */
  Sponsor?: string
}
