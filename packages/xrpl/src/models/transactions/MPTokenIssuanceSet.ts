import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateRequiredField,
  Account,
  validateOptionalField,
  isAccount,
  GlobalFlags,
} from './common'
import { ValidationError } from '../../errors'

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
export interface MPTokenIssuanceSetFlagsInterface extends GlobalFlags {
  tfMPTLock?: boolean
  tfMPTUnlock?: boolean
}

/**
 * The MPTokenIssuanceSet transaction is used to globally lock/unlock a MPTokenIssuance,
 * or lock/unlock an individual's MPToken.
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
  MPTokenHolder?: Account
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
  validateOptionalField(tx, 'MPTokenHolder', isAccount)

  const flags = tx.Flags as number
  if (
    BigInt(flags) & BigInt(MPTokenIssuanceSetFlags.tfMPTLock) &&
    BigInt(flags) & BigInt(MPTokenIssuanceSetFlags.tfMPTUnlock)
  ) {
    throw new ValidationError('MPTokenIssuanceSet: flag conflict')
  }
}
