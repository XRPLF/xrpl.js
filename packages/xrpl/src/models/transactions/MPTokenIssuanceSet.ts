import { ValidationError } from '../../errors'
import { isFlagEnabled, isHex } from '../utils'
// eslint-disable-next-line import/no-cycle -- this method is needed to convert txn flags to number
import { convertTxFlagsToNumber } from '../utils/flags'
import {
  MAX_MPT_META_BYTE_LENGTH,
  MPT_META_WARNING_HEADER,
  validateMPTokenMetadata,
} from '../utils/mptokenMetadata'

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
  isDomainID,
} from './common'
import { MAX_TRANSFER_FEE } from './MPTokenIssuanceCreate'

import type { Transaction } from '.'

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
 * MutableFlags for an MPTokenIssuanceSet transaction (XLS-94D).
 *
 * Each flag enables the corresponding capability flag on the MPTokenIssuance
 * ledger object. These flags are one-way: once a capability is enabled, it can
 * not be disabled via a subsequent MPTokenIssuanceSet transaction.
 */
export enum MPTokenIssuanceSetMutableFlags {
  /* Enables the lsfMPTCanLock flag. Allows the token to be locked both individually and globally. */
  tmfMPTSetCanLock = 0x00000001,
  /* Enables the lsfMPTRequireAuth flag. Requires individual holders to be authorized. */
  tmfMPTSetRequireAuth = 0x00000002,
  /* Enables the lsfMPTCanEscrow flag. Allows holders to place balances into escrow. */
  tmfMPTSetCanEscrow = 0x00000004,
  /* Enables the lsfMPTCanTrade flag. Allows holders to trade balances on the XRPL DEX. */
  tmfMPTSetCanTrade = 0x00000008,
  /* Enables the lsfMPTCanTransfer flag. Allows tokens to be transferred to non-issuer accounts. */
  tmfMPTSetCanTransfer = 0x00000010,
  /* Enables the lsfMPTCanClawback flag. Enables the issuer to claw back tokens via Clawback or AMMClawback transactions. */
  tmfMPTSetCanClawback = 0x00000020,
}

/* eslint-disable no-bitwise -- Need bitwise operations to replicate rippled behavior */
export const tmfMPTokenIssuanceSetMutableMask = ~(
  MPTokenIssuanceSetMutableFlags.tmfMPTSetCanLock |
  MPTokenIssuanceSetMutableFlags.tmfMPTSetRequireAuth |
  MPTokenIssuanceSetMutableFlags.tmfMPTSetCanEscrow |
  MPTokenIssuanceSetMutableFlags.tmfMPTSetCanTrade |
  MPTokenIssuanceSetMutableFlags.tmfMPTSetCanTransfer |
  MPTokenIssuanceSetMutableFlags.tmfMPTSetCanClawback
)
/* eslint-enable no-bitwise */

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

export interface MPTokenIssuanceSetMutableFlagsInterface {
  /* Enables the lsfMPTCanLock flag. Allows the token to be locked both individually and globally. */
  tmfMPTSetCanLock?: boolean
  /* Enables the lsfMPTRequireAuth flag. Requires individual holders to be authorized. */
  tmfMPTSetRequireAuth?: boolean
  /* Enables the lsfMPTCanEscrow flag. Allows holders to place balances into escrow. */
  tmfMPTSetCanEscrow?: boolean
  /* Enables the lsfMPTCanTrade flag. Allows holders to trade balances on the XRPL DEX. */
  tmfMPTSetCanTrade?: boolean
  /* Enables the lsfMPTCanTransfer flag. Allows tokens to be transferred to non-issuer accounts. */
  tmfMPTSetCanTransfer?: boolean
  /* Enables the lsfMPTCanClawback flag. Enables the issuer to claw back tokens via Clawback or AMMClawback transactions. */
  tmfMPTSetCanClawback?: boolean
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

  /**
   * New metadata to set on the issuance, in hex format (max 1024 bytes). The
   * issuance must have been created with `tmfMPTCanMutateMetadata`, otherwise
   * the mutation is rejected. Should follow the
   * {@link https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0089-multi-purpose-token-metadata-schema | XLS-89} standard.
   */
  MPTokenMetadata?: string
  /**
   * New transfer fee for secondary sales, between 0 and 50,000 inclusive (in
   * increments of 0.001%). The issuance must have been created with
   * `tmfMPTCanMutateTransferFee`, otherwise the mutation is rejected.
   */
  TransferFee?: number
  /**
   * A one-way "enable" bitmask of {@link MPTokenIssuanceSetMutableFlags} that
   * turns on the corresponding capability flag(s) on the MPTokenIssuance. Each
   * enable requires the matching `tmfMPTCanEnable*` flag to have been granted
   * at creation; once enabled a capability cannot be disabled. (XLS-94D)
   */
  MutableFlags?: number
  /**
   * The PermissionedDomain object ID that gates who may hold this MPT. Cannot
   * be set together with the `Holder` field.
   */
  DomainID?: string
}

/* eslint-disable max-lines-per-function, max-statements -- All validation rules are needed */
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
  validateOptionalField(tx, 'DomainID', isDomainID)

  if (tx.DomainID != null && tx.Holder != null) {
    throw new ValidationError(
      'MPTokenIssuanceSet: Cannot set both DomainID and Holder fields.',
    )
  }
  if (tx.MutableFlags != null) {
    // eslint-disable-next-line no-bitwise -- Need bitwise operations to replicate rippled behavior
    const invalidBits = tx.MutableFlags & tmfMPTokenIssuanceSetMutableMask
    // rippled rejects a present-but-zero MutableFlags, as well as out-of-mask bits.
    if (tx.MutableFlags === 0 || invalidBits !== 0) {
      throw new ValidationError(
        'MPTokenIssuanceSet: Invalid MutableFlags value',
      )
    }
  }

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

  if (tx.Holder != null && tx.Holder === tx.Account) {
    throw new ValidationError(
      'MPTokenIssuanceSet: Holder cannot be the same as the Account.',
    )
  }

  const isMutate =
    tx.MutableFlags != null ||
    tx.MPTokenMetadata != null ||
    tx.TransferFee != null
  if (
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Pseudo-Txn missing in BaseTransaction type.
    convertTxFlagsToNumber(tx as Transaction) === 0 &&
    tx.DomainID == null &&
    !isMutate
  ) {
    throw new ValidationError(
      'MPTokenIssuanceSet: Transaction does not change the state of the MPTokenIssuance ledger object.',
    )
  }

  if (isMutate && tx.Holder != null) {
    throw new ValidationError(
      'MPTokenIssuanceSet: Holder field is not allowed when mutating MPTokenIssuance.',
    )
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Pseudo-Txn missing in BaseTransaction type.
  if (isMutate && convertTxFlagsToNumber(tx as Transaction) !== 0) {
    throw new ValidationError(
      'MPTokenIssuanceSet: Can not set flags when mutating MPTokenIssuance.',
    )
  }

  if (typeof tx.TransferFee === 'number') {
    if (tx.TransferFee < 0 || tx.TransferFee > MAX_TRANSFER_FEE) {
      throw new ValidationError(
        `MPTokenIssuanceSet: TransferFee must be between 0 and ${MAX_TRANSFER_FEE}`,
      )
    }
  }

  // An empty MPTokenMetadata is valid on MPTokenIssuanceSet: per rippled it
  // clears the existing metadata (makeFieldAbsent). Only validate the hex
  // format, length, and XLS-89 schema when a non-empty value is supplied.
  if (typeof tx.MPTokenMetadata === 'string' && tx.MPTokenMetadata.length > 0) {
    if (
      !isHex(tx.MPTokenMetadata) ||
      tx.MPTokenMetadata.length / 2 > MAX_MPT_META_BYTE_LENGTH
    ) {
      throw new ValidationError(
        `MPTokenIssuanceSet: MPTokenMetadata must be a valid hex string no more than ${MAX_MPT_META_BYTE_LENGTH} bytes (an empty string clears the field).`,
      )
    }

    const validationMessages = validateMPTokenMetadata(tx.MPTokenMetadata)

    if (validationMessages.length > 0) {
      const message = [
        MPT_META_WARNING_HEADER,
        ...validationMessages.map((msg) => `- ${msg}`),
      ].join('\n')

      // eslint-disable-next-line no-console -- Required here.
      console.warn(message)
    }
  }
}
/* eslint-enable max-lines-per-function, max-statements */
