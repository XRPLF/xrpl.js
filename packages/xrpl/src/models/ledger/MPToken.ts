import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface MPToken extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'MPToken'
  MPTokenIssuanceID: string
  MPTAmount: string
  Flags: number
  OwnerNode?: string
  LockedAmount?: string
  /**
   * (Optional) The account sponsoring the reserve for this MPToken. If
   * present, the sponsor is responsible for the reserve requirement of this
   * object instead of the owner.
   */
  Sponsor?: string
}
