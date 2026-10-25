import { ValidationError } from '../../errors'
import { hasFlag } from '../utils'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  validateBaseTransaction,
  validateFlagsMask,
  validateRequiredField,
} from './common'
import {
  isCurrencyCode,
  validateTokenIssuanceSettings,
} from './tokenIssuanceCreate'

/**
 * Transaction Flags for a {@link TokenIssuanceSet} transaction.
 *
 * @category Transaction Flags
 */
export enum TokenIssuanceSetFlags {
  /** Sets `lsfTokenCannotLock`: the issuer renounces locking this currency. */
  tfTokenCannotLock = 0x00000001,
  /** Sets `lsfTokenLocked`, a global freeze of this currency. */
  tfTokenLock = 0x00000002,
  /** Clears `lsfTokenLocked`. */
  tfTokenUnlock = 0x00000004,
}

/**
 * Map of flags to boolean values representing {@link TokenIssuanceSet}
 * transaction flags.
 *
 * @category Transaction Flags
 */
export interface TokenIssuanceSetFlagsInterface extends GlobalFlagsInterface {
  tfTokenCannotLock?: boolean
  tfTokenLock?: boolean
  tfTokenUnlock?: boolean
}

/**
 * The TokenIssuanceSet transaction changes the issuer's TokenIssuance for a
 * currency: locks or unlocks it, binds an MPT issuance, or sets its transfer
 * fee or metadata.
 *
 * @category Transaction Models
 */
export interface TokenIssuanceSet extends BaseTransaction {
  TransactionType: 'TokenIssuanceSet'
  Flags?: number | TokenIssuanceSetFlagsInterface

  /** The currency code of the TokenIssuance to change. */
  Currency: string

  /**
   * The MPTokenIssuance to bind the IOU to. The binding can be set only once.
   */
  MPTokenIssuanceID?: string

  /** The new transfer fee in tenths of a basis point, between 0 and 50,000. */
  TransferFee?: number

  /** New metadata in hex, between 1 and 1024 bytes. */
  MPTokenMetadata?: string
}

/**
 * Verify the form and type of a {@link TokenIssuanceSet} at runtime.
 *
 * @param tx - A {@link TokenIssuanceSet} Transaction.
 * @throws When the {@link TokenIssuanceSet} is malformed.
 */
export function validateTokenIssuanceSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx, TokenIssuanceSetFlags)
  validateRequiredField(tx, 'Currency', isCurrencyCode)

  const lock = hasFlag(tx, TokenIssuanceSetFlags.tfTokenLock, 'tfTokenLock')
  if (
    lock &&
    hasFlag(tx, TokenIssuanceSetFlags.tfTokenUnlock, 'tfTokenUnlock')
  ) {
    throw new ValidationError(
      'TokenIssuanceSet: tfTokenLock and tfTokenUnlock cannot both be set',
    )
  }
  if (
    lock &&
    hasFlag(tx, TokenIssuanceSetFlags.tfTokenCannotLock, 'tfTokenCannotLock')
  ) {
    throw new ValidationError(
      'TokenIssuanceSet: tfTokenCannotLock and tfTokenLock cannot both be set',
    )
  }

  validateTokenIssuanceSettings(tx)
}
