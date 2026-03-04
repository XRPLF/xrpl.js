import { MPTAmount } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * Flags for the MPToken ledger entry.
 */
export enum MPTokenFlags {
  /**
   * If set, indicates that the MPToken holder has authorized this token.
   */
  lsfMPTAuthorized = 0x00000002,
}

export interface MPToken extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'MPToken'
  MPTokenIssuanceID: string
  MPTAmount?: MPTAmount
  Flags: number
  OwnerNode?: string
  LockedAmount?: string

  /**
   * The holder's ElGamal public key for confidential transfers.
   * Required for participating in confidential transfers.
   */
  HolderElGamalPublicKey?: string

  /**
   * Encrypted balance value for issuer tracking purposes.
   * This allows the issuer to track confidential balances.
   */
  IssuerEncryptedBalance?: string

  /**
   * Encrypted balance value for auditor tracking purposes (if configured).
   * This allows an auditor to track confidential balances.
   */
  AuditorEncryptedBalance?: string

  /**
   * The confidential balance inbox for pending incoming transfers.
   * Contains encrypted amounts that have not yet been merged.
   */
  ConfidentialBalanceInbox?: string

  /**
   * The confidential balance available for spending.
   * Contains the merged encrypted balance.
   */
  ConfidentialBalanceSpending?: string

  /**
   * Version counter for the confidential balance.
   * Incremented with each update to prevent replay attacks.
   */
  ConfidentialBalanceVersion?: number
}
