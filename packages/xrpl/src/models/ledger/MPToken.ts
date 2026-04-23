import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface MPToken extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'MPToken'
  MPTokenIssuanceID: string
  MPTAmount: string
  Flags: number
  OwnerNode?: string
  LockedAmount?: string
}
