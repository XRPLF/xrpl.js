import { ValidationError } from '../../errors'
import { Currency } from '../common'
import { isFlagEnabled } from '../utils'
import {
  BaseTransaction,
  GlobalFlags,
  isCurrency,
  isNumber,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

const MAX_DATA_LENGTH = 256 * 2

/** Enum for WithdrawalPolicy */
export enum WithdrawalStrategy {
  /** Requests are processed on a first-come-first-serve basis. */
  strFirstComeFirstServe = 0x01,
}

/**
 * Transaction Flags for an VaultCreate Transaction.
 *
 * @category Transaction Flags
 */
export enum VaultCreateFlags {
  /**
   * Indicates that the vault is private. It can only be set during Vault creation.
   */
  tfVaultPrivate = 0x00000001,

  /**
   * Indicates the vault share is non-transferable. It can only be set during Vault creation.
   */
  tfVaultShareNonTransferable = 0x00000002,
}

export interface VaultCreateFlagsInterface extends GlobalFlags {
  tfVaultPrivate?: boolean
  tfVaultShareNonTransferable?: boolean
}

export interface VaultCreate extends BaseTransaction {
  TransactionType: 'VaultCreate'

  /**
   * The asset (XRP, IOU or MPT) of the Vault.
   */
  Asset: Currency

  /**
   * Arbitrary Vault metadata, limited to 256 bytes.
   */
  Data?: string

  /** The maximum asset amount that can be held in a vault. */
  AssetMaximum?: number

  /** Arbitrary metadata about the share MPT, in hex format, limited to 1024 bytes. */
  MPTokenMetadata?: string

  /** Indicates the withdrawal strategy used by the Vault. */
  WithdrawalPolicy?: WithdrawalStrategy

  /** The PermissionedDomain object ID associated with the shares of this Vault. */
  DomainID?: string

  Flags?: number | VaultCreateFlagsInterface
}

export function validateVaultCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Asset', isCurrency)
  validateOptionalField(tx, 'Data', isString)
  validateOptionalField(tx, 'AssetMaximum', isNumber)
  validateOptionalField(tx, 'MPTokenMetadata', isString)
  validateOptionalField(tx, 'DomainID', isString)

  if (tx.DomainID != null) {
    if (tx.Flags == null) {
      throw new ValidationError(
        'VaultCreate: tfVaultPrivate flag must be set if DomainID is present',
      )
    }

    const flags = tx.Flags as number | VaultCreateFlagsInterface
    const isTfVaultPrivateEnabled =
      typeof flags === 'number'
        ? isFlagEnabled(flags, VaultCreateFlags.tfVaultPrivate)
        : flags.tfVaultPrivate ?? false

    if (!isTfVaultPrivateEnabled) {
      throw new ValidationError(
        'VaultCreate: tfVaultPrivate flag must be set if DomainID is present',
      )
    }
  }

  if (tx.Data != null && (tx.Data as string).length > MAX_DATA_LENGTH) {
    throw new ValidationError(
      `VaultCreate: Data length must be <= ${MAX_DATA_LENGTH}`,
    )
  }
}
