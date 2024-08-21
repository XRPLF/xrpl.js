import { MPTAmount } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface MPToken extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'MPToken'
  MPTokenIssuanceID: string
  MPTAmount: MPTAmount
  LockedAmount?: MPTAmount
  Flags: number
  OwnerNode?: string
}
