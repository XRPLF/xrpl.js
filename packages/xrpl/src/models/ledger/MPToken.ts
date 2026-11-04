import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

export interface MPToken extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'MPToken'
  MPTokenIssuanceID: string
  MPTAmount: string
  Flags: number
  OwnerNode?: string
  LockedAmount?: string
  /** ElGamal ciphertext of the holder's pending confidential inbox balance. */
  ConfidentialBalanceInbox?: string
  /** ElGamal ciphertext of the holder's spendable confidential balance. */
  ConfidentialBalanceSpending?: string
  /** Version counter for the holder's confidential balance state. */
  ConfidentialBalanceVersion?: number
  /** ElGamal ciphertext of the holder's confidential balance under the issuer's key. */
  IssuerEncryptedBalance?: string
  /** ElGamal ciphertext of the holder's confidential balance under the auditor's key. */
  AuditorEncryptedBalance?: string
  /** The holder's registered compressed ElGamal encryption key. */
  HolderEncryptionKey?: string
  /**
   * (Optional) The account sponsoring the reserve for this MPToken. If
   * present, the sponsor is responsible for the reserve requirement of this
   * object instead of the owner.
   */
  Sponsor?: string
}
