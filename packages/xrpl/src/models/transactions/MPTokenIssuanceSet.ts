import { ValidationError } from '../../errors'
import { isFlagEnabled, isHex } from '../utils'

import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateRequiredField,
  Account,
  validateOptionalField,
  isAccount,
  GlobalFlagsInterface,
  isNumber,
  MAX_MPT_META_BYTE_LENGTH,
} from './common'
import { MAX_TRANSFER_FEE } from './MPTokenIssuanceCreate'

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
  // The below flags are used in the MutableFlags field
  /* Sets the lsfMPTCanLock flag. Enables the token to be locked both individually and globally. */
  tfMPTSetCanLock = 0x00000001,
  /* Clears the lsfMPTCanLock flag. Disables both individual and global locking of the token. */
  tfMPTClearCanLock = 0x00000002,
  /* Sets the lsfMPTRequireAuth flag. Requires individual holders to be authorized. */
  tfMPTSetRequireAuth = 0x00000004,
  /* Clears the lsfMPTRequireAuth flag. Holders are not required to be authorized. */
  tfMPTClearRequireAuth = 0x00000008,
  /* Sets the lsfMPTCanEscrow flag. Allows holders to place balances into escrow. */
  tfMPTSetCanEscrow = 0x00000010,
  /* Clears the lsfMPTCanEscrow flag. Disallows holders from placing balances into escrow. */
  tfMPTClearCanEscrow = 0x00000020,
  /* Sets the lsfMPTCanTrade flag. Allows holders to trade balances on the XRPL DEX. */
  tfMPTSetCanTrade = 0x00000040,
  /* Clears the lsfMPTCanTrade flag. Disallows holders from trading balances on the XRPL DEX. */
  tfMPTClearCanTrade = 0x00000080,
  /* Sets the lsfMPTCanTransfer flag. Allows tokens to be transferred to non-issuer accounts. */
  tfMPTSetCanTransfer = 0x00000100,
  /* Clears the lsfMPTCanTransfer flag. Disallows transfers to non-issuer accounts. */
  tfMPTClearCanTransfer = 0x00000200,
  /* Sets the lsfMPTCanClawback flag. Enables the issuer to claw back tokens via Clawback or AMMClawback transactions. */
  tfMPTSetCanClawback = 0x00000400,
  /* Clears the lsfMPTCanClawback flag. The token can not be clawed back. */
  tfMPTClearCanClawback = 0x00000800,
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
  // The below flags are used in the MutableFlags field
  /* Sets the lsfMPTCanLock flag. Enables the token to be locked both individually and globally. */
  tfMPTSetCanLock?: boolean
  /* Clears the lsfMPTCanLock flag. Disables both individual and global locking of the token. */
  tfMPTClearCanLock?: boolean
  /* Sets the lsfMPTRequireAuth flag. Requires individual holders to be authorized. */
  tfMPTSetRequireAuth?: boolean
  /* Clears the lsfMPTRequireAuth flag. Holders are not required to be authorized. */
  tfMPTClearRequireAuth?: boolean
  /* Sets the lsfMPTCanEscrow flag. Allows holders to place balances into escrow. */
  tfMPTSetCanEscrow?: boolean
  /* Clears the lsfMPTCanEscrow flag. Disallows holders from placing balances into escrow. */
  tfMPTClearCanEscrow?: boolean
  /* Sets the lsfMPTCanTrade flag. Allows holders to trade balances on the XRPL DEX. */
  tfMPTSetCanTrade?: boolean
  /* Clears the lsfMPTCanTrade flag. Disallows holders from trading balances on the XRPL DEX. */
  tfMPTClearCanTrade?: boolean
  /* Sets the lsfMPTCanTransfer flag. Allows tokens to be transferred to non-issuer accounts. */
  tfMPTSetCanTransfer?: boolean
  /* Clears the lsfMPTCanTransfer flag. Disallows transfers to non-issuer accounts. */
  tfMPTClearCanTransfer?: boolean
  /* Sets the lsfMPTCanClawback flag. Enables the issuer to claw back tokens via Clawback or AMMClawback transactions. */
  tfMPTSetCanClawback?: boolean
  /* Clears the lsfMPTCanClawback flag. The token can not be clawed back. */
  tfMPTClearCanClawback?: boolean
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
  Holder?: Account
  Flags?: number | MPTokenIssuanceSetFlagsInterface

  MPTokenMetadata?: string
  TransferFee?: number
  MutableFlags?: number
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
  validateOptionalField(tx, 'MPTokenMetadata', isString)
  validateOptionalField(tx, 'TransferFee', isNumber)
  validateOptionalField(tx, 'MutableFlags', isNumber)

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

  if (typeof tx.TransferFee === 'number') {
    if (tx.TransferFee < 0 || tx.TransferFee > MAX_TRANSFER_FEE) {
      throw new ValidationError(
        `MPTokenIssuanceSet: TransferFee must be between 0 and ${MAX_TRANSFER_FEE}`,
      )
    }
  }

  if (
    typeof tx.MPTokenMetadata === 'string' &&
    (!isHex(tx.MPTokenMetadata) ||
      tx.MPTokenMetadata.length / 2 > MAX_MPT_META_BYTE_LENGTH)
  ) {
    throw new ValidationError(
      `MPTokenIssuanceSet: MPTokenMetadata (hex format) must be non-empty and no more than ${MAX_MPT_META_BYTE_LENGTH} bytes.`,
    )
  }
}
