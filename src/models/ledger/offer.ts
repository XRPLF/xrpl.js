import { Amount } from '../common'

import BaseLedgerEntry from './baseLedgerEntry'

export default interface Offer extends BaseLedgerEntry {
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
