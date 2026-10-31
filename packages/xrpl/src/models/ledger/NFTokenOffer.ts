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
}

export enum NFTokenOfferFlags {
  /** The offer sells the NFToken; without it, the offer buys. */
  lsfSellNFToken = 0x00000001,
}
