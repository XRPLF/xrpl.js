import { Amount } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface NFTokenOffer extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'NFTokenOffer'
  Amount: Amount
  Destination?: string
  Expiration?: number
  Flags: number
  NFTokenID: string
  NFTokenOfferNode?: string
  Owner: string
  OwnerNode?: string
}
