import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface MPTokenIssuance extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'MPTokenIssuance'
  Flags: number
  Issuer: string
  AssetScale?: number
  MaximumAmount?: string
  OutstandingAmount: string
  TransferFee?: number
  MPTokenMetadata?: string
  OwnerNode?: string

  // (Optional) The total of all outstanding escrows for this issuance.
  LockedAmount?: string
}
