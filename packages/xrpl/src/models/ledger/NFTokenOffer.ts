import { Amount } from '../common'

import BaseLedgerEntry from './BaseLedgerEntry'

export interface NFTokenOffer extends BaseLedgerEntry {
  LedgerEntryType: 'NFTokenOffer'
  Amount: Amount
  Destination?: string
  Expiration: number
  Flags: number
  NFTokenOfferNode?: string
  Owner: string
  OwnerNode?: string
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
}
