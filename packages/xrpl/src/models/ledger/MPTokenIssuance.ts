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
  LockedAmount?: string
  /** The issuer's registered compressed ElGamal encryption key. */
  IssuerEncryptionKey?: string
  /** The auditor's registered compressed ElGamal encryption key. */
  AuditorEncryptionKey?: string
  /** The total confidential (encrypted) outstanding amount for this issuance. */
  ConfidentialOutstandingAmount?: string
}
