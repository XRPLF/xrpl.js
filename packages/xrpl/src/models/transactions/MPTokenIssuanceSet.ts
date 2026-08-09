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
  isHexWithByteLength,
  CONFIDENTIAL_EC_POINT_BYTES,
} from './common'
import {
  MAX_TRANSFER_FEE,
  tifMPTokenIssuanceImmutableMask,
} from './MPTokenIssuanceCreate'

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
  /**
   * Sets the `lsfMPTCanLock` flag. Enables the token to be locked both individually and globally. (XLS-94D)
   */
  tfMPTSetCanLock = 0x00000004,
  /**
   * Sets the `lsfMPTRequireAuth` flag. Requires individual holders to be authorized. (XLS-94D)
   */
  tfMPTSetRequireAuth = 0x00000008,
  /**
   * Sets the `lsfMPTCanEscrow` flag. Allows holders to place balances into escrow. (XLS-94D)
   */
  tfMPTSetCanEscrow = 0x00000010,
  /**
   * Sets the `lsfMPTCanTrade` flag. Allows holders to trade balances on the XRPL DEX. (XLS-94D)
   */
  tfMPTSetCanTrade = 0x00000020,
  /**
   * Sets the `lsfMPTCanTransfer` flag. Allows tokens to be transferred to non-issuer accounts. (XLS-94D)
   */
  tfMPTSetCanTransfer = 0x00000040,
  /**
   * Sets the `lsfMPTCanClawback` flag. Enables the issuer to claw back tokens
   * via `Clawback` or `AMMClawback` transactions. (XLS-94D)
   */
  tfMPTSetCanClawback = 0x00000080,
  /**
   * Sets the `lsfMPTCanHoldConfidentialBalance` flag. Enables the token to be held
   * in a confidential balance. (XLS-96 Confidential MPT)
   */
  tfMPTSetCanHoldConfidentialBalance = 0x00000100,
}

/* eslint-disable no-bitwise -- Need bitwise operations to replicate rippled behavior */
/**
 * The set of capability-setting `tfMPTSet*` flags. These one-way flags enable
 * the corresponding capability on the MPTokenIssuance ledger object; once
 * enabled, a capability cannot be disabled via a subsequent MPTokenIssuanceSet.
 */
export const tfMPTokenIssuanceSetEnableFlagMask =
  MPTokenIssuanceSetFlags.tfMPTSetCanLock |
  MPTokenIssuanceSetFlags.tfMPTSetRequireAuth |
  MPTokenIssuanceSetFlags.tfMPTSetCanEscrow |
  MPTokenIssuanceSetFlags.tfMPTSetCanTrade |
  MPTokenIssuanceSetFlags.tfMPTSetCanTransfer |
  MPTokenIssuanceSetFlags.tfMPTSetCanClawback |
  MPTokenIssuanceSetFlags.tfMPTSetCanHoldConfidentialBalance
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
  /* Sets the `lsfMPTCanLock` flag. Enables the token to be locked both individually and globally. */
  tfMPTSetCanLock?: boolean
  /* Sets the `lsfMPTRequireAuth` flag. Requires individual holders to be authorized. */
  tfMPTSetRequireAuth?: boolean
  /* Sets the `lsfMPTCanEscrow` flag. Allows holders to place balances into escrow. */
  tfMPTSetCanEscrow?: boolean
  /* Sets the `lsfMPTCanTrade` flag. Allows holders to trade balances on the XRPL DEX. */
  tfMPTSetCanTrade?: boolean
  /* Sets the `lsfMPTCanTransfer` flag. Allows tokens to be transferred to non-issuer accounts. */
  tfMPTSetCanTransfer?: boolean
  /**
   * Sets the `lsfMPTCanClawback` flag. Enables the issuer to claw back tokens
   * via `Clawback` or `AMMClawback` transactions.
   */
  tfMPTSetCanClawback?: boolean
  /**
   * Sets the `lsfMPTCanHoldConfidentialBalance` flag. Enables the token to be
   * held in a confidential balance. (XLS-96 Confidential MPT)
   */
  tfMPTSetCanHoldConfidentialBalance?: boolean
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
  /**
   * The issuer's compressed ElGamal encryption key (33-byte EC point),
   * registered so confidential amounts can be encrypted to the issuer.
   */
  IssuerEncryptionKey?: string
  /**
   * The auditor's compressed ElGamal encryption key (33-byte EC point),
   * registered so confidential amounts can be encrypted to an auditor.
   */
  AuditorEncryptionKey?: string
  Flags?: number | MPTokenIssuanceSetFlagsInterface

  /**
   * New metadata to replace the existing value, in hex format (max 1024 bytes).
   * The transaction will be rejected if `lsifMPTMetadata` has been set in
   * `ImmutableFlags`. Setting an empty `MPTokenMetadata` removes the field.
   * Should follow the
   * {@link https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0089-multi-purpose-token-metadata-schema | XLS-89} standard.
   */
  MPTokenMetadata?: string
  /**
   * New transfer fee value, between 0 and 50,000 inclusive (in increments of
   * 0.001%). The transaction will be rejected if `lsifMPTTransferFee` has been
   * set in `ImmutableFlags`. A non-zero value requires `lsfMPTCanTransfer` to
   * already be set on the ledger, or to be enabled by this same transaction via
   * `tfMPTSetCanTransfer`. Setting `TransferFee` to zero removes the field.
   */
  TransferFee?: number
  /**
   * Declares which fields or flags are immutable, via a bitmask of
   * {@link MPTokenIssuanceCreateImmutableFlags} (`tif*`). Once a bit is set, the
   * corresponding field or flag can never be set or modified again. The
   * `ImmutableFlags` provided here are added to the current ledger object's
   * `ImmutableFlags`; it is not a complete replacement. (XLS-94D)
   */
  ImmutableFlags?: number
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
  validateOptionalField(
    tx,
    'IssuerEncryptionKey',
    isHexWithByteLength(CONFIDENTIAL_EC_POINT_BYTES),
  )
  validateOptionalField(
    tx,
    'AuditorEncryptionKey',
    isHexWithByteLength(CONFIDENTIAL_EC_POINT_BYTES),
  )
  if (tx.AuditorEncryptionKey != null && tx.IssuerEncryptionKey == null) {
    throw new ValidationError(
      'MPTokenIssuanceSet: AuditorEncryptionKey requires IssuerEncryptionKey',
    )
  }
  validateOptionalField(tx, 'MPTokenMetadata', isString)
  validateOptionalField(tx, 'TransferFee', isNumber)
  validateOptionalField(tx, 'ImmutableFlags', isNumber)
  validateOptionalField(tx, 'DomainID', isDomainID)

  if (tx.DomainID != null && tx.Holder != null) {
    throw new ValidationError(
      'MPTokenIssuanceSet: Cannot set both DomainID and Holder fields.',
    )
  }

  if (typeof tx.ImmutableFlags === 'number') {
    // eslint-disable-next-line no-bitwise -- Need bitwise operations to replicate rippled behavior
    const invalidBits = tx.ImmutableFlags & tifMPTokenIssuanceImmutableMask
    // rippled rejects a present-but-zero ImmutableFlags, as well as out-of-mask bits.
    if (tx.ImmutableFlags === 0 || invalidBits !== 0) {
      throw new ValidationError(
        'MPTokenIssuanceSet: Invalid ImmutableFlags value',
      )
    }
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Pseudo-Txn missing in BaseTransaction type.
  const flagsNum = convertTxFlagsToNumber(tx as Transaction)
  const isTfMPTLock = isFlagEnabled(flagsNum, MPTokenIssuanceSetFlags.tfMPTLock)
  const isTfMPTUnlock = isFlagEnabled(
    flagsNum,
    MPTokenIssuanceSetFlags.tfMPTUnlock,
  )
  // eslint-disable-next-line no-bitwise -- Need bitwise operations to replicate rippled behavior
  const hasEnableFlag = (flagsNum & tfMPTokenIssuanceSetEnableFlagMask) !== 0

  if (isTfMPTLock && isTfMPTUnlock) {
    throw new ValidationError('MPTokenIssuanceSet: flag conflict')
  }

  if (tx.Holder != null && tx.Holder === tx.Account) {
    throw new ValidationError(
      'MPTokenIssuanceSet: Holder cannot be the same as the Account.',
    )
  }

  // A mutation sets/updates a capability flag, MPTokenMetadata, TransferFee, or
  // ImmutableFlags. These may not be combined with a Holder or a lock/unlock.
  const isMutate =
    hasEnableFlag ||
    tx.MPTokenMetadata != null ||
    tx.TransferFee != null ||
    tx.ImmutableFlags != null
  const isSetConfidentialKeys =
    tx.IssuerEncryptionKey != null || tx.AuditorEncryptionKey != null

  if (
    flagsNum === 0 &&
    tx.DomainID == null &&
    !isMutate &&
    !isSetConfidentialKeys
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

  if (isMutate && (isTfMPTLock || isTfMPTUnlock)) {
    throw new ValidationError(
      'MPTokenIssuanceSet: Can not lock/unlock while mutating MPTokenIssuance.',
    )
  }

  if (typeof tx.TransferFee === 'number') {
    if (tx.TransferFee < 0 || tx.TransferFee > MAX_TRANSFER_FEE) {
      throw new ValidationError(
        `MPTokenIssuanceSet: TransferFee must be between 0 and ${MAX_TRANSFER_FEE}`,
      )
    }
    // Confidential amounts are encrypted, so a transfer rate cannot apply;
    // rippled rejects this pairing with temBAD_TRANSFER_FEE.
    if (
      tx.TransferFee > 0 &&
      isFlagEnabled(
        flagsNum,
        MPTokenIssuanceSetFlags.tfMPTSetCanHoldConfidentialBalance,
      )
    ) {
      throw new ValidationError(
        'MPTokenIssuanceSet: TransferFee cannot be provided together with the tfMPTSetCanHoldConfidentialBalance flag',
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
