import {RippledAmount} from './amounts'

export interface OfferCreateTransaction {
  TransactionType: 'OfferCreate',
  Account: string,
  Fee: string,
  Flags: number,
  LastLedgerSequence: number,
  Sequence: number,
  TakerGets: RippledAmount,
  TakerPays: RippledAmount,
  Expiration?: number,
  OfferSequence?: number,
}
