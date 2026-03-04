import { ValidationError } from '../../errors'
import { isFlagEnabled } from '../utils'

import {
  BaseTransaction,
  isString,
  isNumber,
  validateBaseTransaction,
  validateRequiredField,
  Account,
  validateOptionalField,
  isAccount,
  GlobalFlagsInterface,
} from './common'

/**
 * Transaction Flags for an MPTokenIssuanceSet Transaction.
 *
 * @category Transaction Flags
 */
export enum MPTokenIssuanceSetFlags {
  /**
   * If set, indicates that issuer locks the MPT
   */
  tfMPTLock = 0x00000001,
  /**
   * If set, indicates that issuer unlocks the MPT
   */
  tfMPTUnlock = 0x00000002,
}

/**
 * Map of flags to boolean values representing {@link MPTokenIssuanceSet} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface MPTokenIssuanceSetFlagsInterface extends GlobalFlagsInterface {
  tfMPTLock?: boolean
  tfMPTUnlock?: boolean
}

/**
 * The MPTokenIssuanceSet transaction is used to globally lock/unlock a MPTokenIssuance,
 * lock/unlock an individual's MPToken, or update mutable issuance settings.
 */
export interface MPTokenIssuanceSet extends BaseTransaction {
  TransactionType: 'MPTokenIssuanceSet'
  /**
   * Identifies the MPTokenIssuance
   */
  MPTokenIssuanceID: string
  /**
   * An optional XRPL Address of an individual token holder balance to lock/unlock.
   * If omitted, this transaction will apply to all any accounts holding MPTs.
   */
  Holder?: Account
  /**
   * The permissioned domain ID to associate with this issuance.
   */
  DomainID?: string
  /**
   * Updated metadata for the issuance. Can only be changed if the issuance
   * was created with the appropriate mutable flag.
   */
  MPTokenMetadata?: string
  /**
   * Updated transfer fee. Can only be changed if the issuance was created
   * with the appropriate mutable flag.
   */
  TransferFee?: number
  /**
   * Updated mutable flags for the issuance.
   */
  MutableFlags?: number
  /**
   * The issuer's ElGamal public key for confidential transfers.
   * Required to enable confidential transfers on this issuance.
   */
  IssuerElGamalPublicKey?: string
  /**
   * The auditor's ElGamal public key for confidential transfers.
   * Optional; allows an auditor to decrypt confidential balances.
   */
  AuditorElGamalPublicKey?: string

  Flags?: number | MPTokenIssuanceSetFlagsInterface
}

/**
 * Verify the form and type of an MPTokenIssuanceSet at runtime.
 *
 * @param tx - An MPTokenIssuanceSet Transaction.
 * @throws When the MPTokenIssuanceSet is Malformed.
 */
export function validateMPTokenIssuanceSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
  validateOptionalField(tx, 'Holder', isAccount)
  validateOptionalField(tx, 'DomainID', isString)
  validateOptionalField(tx, 'MPTokenMetadata', isString)
  validateOptionalField(tx, 'TransferFee', isNumber)
  validateOptionalField(tx, 'MutableFlags', isNumber)
  validateOptionalField(tx, 'IssuerElGamalPublicKey', isString)
  validateOptionalField(tx, 'AuditorElGamalPublicKey', isString)

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Not necessary
  const flags = (tx.Flags ?? 0) as number | MPTokenIssuanceSetFlagsInterface
  const isTfMPTLock =
    typeof flags === 'number'
      ? isFlagEnabled(flags, MPTokenIssuanceSetFlags.tfMPTLock)
      : (flags.tfMPTLock ?? false)

  const isTfMPTUnlock =
    typeof flags === 'number'
      ? isFlagEnabled(flags, MPTokenIssuanceSetFlags.tfMPTUnlock)
      : (flags.tfMPTUnlock ?? false)

  if (isTfMPTLock && isTfMPTUnlock) {
    throw new ValidationError('MPTokenIssuanceSet: flag conflict')
  }
}
