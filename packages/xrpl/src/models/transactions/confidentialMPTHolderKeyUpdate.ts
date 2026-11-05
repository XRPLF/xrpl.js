import { ValidationError } from '../../errors'
import { hasFlag, isHex } from '../utils'

import {
  BaseTransaction,
  CONFIDENTIAL_EC_POINT_BYTES,
  CONFIDENTIAL_ELGAMAL_CIPHERTEXT_BYTES,
  GlobalFlagsInterface,
  isHexWithByteLength,
  isMPTIssuer,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * Enum representing values of {@link ConfidentialMPTHolderKeyUpdate}
 * transaction flags. Exactly one is set.
 *
 * @category Transaction Flags
 */
export enum ConfidentialMPTHolderKeyUpdateFlags {
  /** Replace the holder's key, re-encrypting both balances under the new one. */
  tfHolderKeyRotation = 0x00010000,
  /** Register a new key for a holder who lost the old one. */
  tfHolderKeyRecovery = 0x00020000,
  /** Revoke a pending recovery. */
  tfCancelRecovery = 0x00040000,
}

/**
 * Map of flags to boolean values representing
 * {@link ConfidentialMPTHolderKeyUpdate} transaction flags.
 *
 * @category Transaction Flags
 */
export type ConfidentialMPTHolderKeyUpdateFlagsInterface =
  GlobalFlagsInterface & {
    tfHolderKeyRotation?: boolean
    tfHolderKeyRecovery?: boolean
    tfCancelRecovery?: boolean
  }

/**
 * The ConfidentialMPTHolderKeyUpdate transaction rotates or recovers a
 * confidential MPT holder's ElGamal encryption key, or cancels a recovery.
 *
 * @category Transaction Models
 */
export interface ConfidentialMPTHolderKeyUpdate extends BaseTransaction {
  TransactionType: 'ConfidentialMPTHolderKeyUpdate'
  Flags?: number | ConfidentialMPTHolderKeyUpdateFlagsInterface
  /**
   * Identifies the MPTokenIssuance whose holder key is updated.
   */
  MPTokenIssuanceID: string
  /**
   * The holder's new compressed ElGamal encryption key (33 bytes). Required
   * for rotation and recovery.
   */
  HolderEncryptionKey?: string
  /**
   * The spendable balance re-encrypted under the new key (66 bytes). Required
   * for rotation, refused for recovery.
   */
  ConfidentialBalanceSpending?: string
  /**
   * The inbox balance re-encrypted under the new key (66 bytes). Required for
   * rotation, refused for recovery.
   */
  ConfidentialBalanceInbox?: string
  /**
   * The proof for the new key. Required for rotation and recovery.
   */
  ZKProof?: string
}

const MODES: Array<keyof typeof ConfidentialMPTHolderKeyUpdateFlags> = [
  'tfHolderKeyRotation',
  'tfHolderKeyRecovery',
  'tfCancelRecovery',
]

type Mode = (typeof MODES)[number]

/**
 * The one mode flag the transaction sets.
 *
 * @param tx - A ConfidentialMPTHolderKeyUpdate Transaction.
 * @returns The mode flag's name.
 * @throws When no mode flag or more than one is set.
 */
function holderKeyUpdateMode(tx: Record<string, unknown>): Mode {
  const modes = MODES.filter((name) =>
    hasFlag(tx, ConfidentialMPTHolderKeyUpdateFlags[name], name),
  )
  if (modes.length !== 1) {
    throw new ValidationError(
      'ConfidentialMPTHolderKeyUpdate: set exactly one of tfHolderKeyRotation, tfHolderKeyRecovery and tfCancelRecovery',
    )
  }
  return modes[0]
}

/**
 * Verify the fields the mode requires and refuses: a cancel carries none of
 * the key fields; rotation and recovery carry a key and a proof; rotation
 * carries both balances and recovery neither.
 *
 * @param tx - A ConfidentialMPTHolderKeyUpdate Transaction.
 * @param mode - The mode flag the transaction sets.
 * @throws When a field is missing or present against the mode.
 */
function validateHolderKeyUpdateFields(
  tx: Record<string, unknown>,
  mode: Mode,
): void {
  const hasKey = tx.HolderEncryptionKey !== undefined
  const hasSpending = tx.ConfidentialBalanceSpending !== undefined
  const hasInbox = tx.ConfidentialBalanceInbox !== undefined
  const hasProof = tx.ZKProof !== undefined

  if (mode === 'tfCancelRecovery') {
    if (hasKey || hasSpending || hasInbox || hasProof) {
      throw new ValidationError(
        'ConfidentialMPTHolderKeyUpdate: tfCancelRecovery carries no HolderEncryptionKey, balances or ZKProof',
      )
    }
    return
  }

  if (!hasKey || !hasProof) {
    throw new ValidationError(
      'ConfidentialMPTHolderKeyUpdate: tfHolderKeyRotation and tfHolderKeyRecovery require HolderEncryptionKey and ZKProof',
    )
  }

  if (mode === 'tfHolderKeyRotation' && (!hasSpending || !hasInbox)) {
    throw new ValidationError(
      'ConfidentialMPTHolderKeyUpdate: tfHolderKeyRotation requires ConfidentialBalanceSpending and ConfidentialBalanceInbox',
    )
  }

  if (mode === 'tfHolderKeyRecovery' && (hasSpending || hasInbox)) {
    throw new ValidationError(
      'ConfidentialMPTHolderKeyUpdate: tfHolderKeyRecovery must not carry ConfidentialBalanceSpending or ConfidentialBalanceInbox',
    )
  }
}

/**
 * Verify the form and type of a ConfidentialMPTHolderKeyUpdate at runtime.
 *
 * @param tx - A ConfidentialMPTHolderKeyUpdate Transaction.
 * @throws When the ConfidentialMPTHolderKeyUpdate is malformed.
 */
export function validateConfidentialMPTHolderKeyUpdate(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
  validateOptionalField(
    tx,
    'HolderEncryptionKey',
    isHexWithByteLength(CONFIDENTIAL_EC_POINT_BYTES),
  )
  validateOptionalField(
    tx,
    'ConfidentialBalanceSpending',
    isHexWithByteLength(CONFIDENTIAL_ELGAMAL_CIPHERTEXT_BYTES),
  )
  validateOptionalField(
    tx,
    'ConfidentialBalanceInbox',
    isHexWithByteLength(CONFIDENTIAL_ELGAMAL_CIPHERTEXT_BYTES),
  )
  validateOptionalField(
    tx,
    'ZKProof',
    (value: unknown): value is string => isString(value) && isHex(value),
  )

  const mode = holderKeyUpdateMode(tx)

  if (isMPTIssuer(tx.Account, tx.MPTokenIssuanceID)) {
    throw new ValidationError(
      'ConfidentialMPTHolderKeyUpdate: the issuer cannot hold confidential balances',
    )
  }

  validateHolderKeyUpdateFields(tx, mode)
}
