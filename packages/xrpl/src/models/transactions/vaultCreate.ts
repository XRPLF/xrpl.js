import { ValidationError } from '../../errors'
import { Currency } from '../common'
import { hasFlag, isHex } from '../utils'

import {
  BaseTransaction,
  validateBaseTransaction,
  GlobalFlagsInterface,
  validateOptionalField,
  isNumber,
  isCurrency,
  validateRequiredField,
  isString,
  VAULT_DATA_MAX_BYTE_LENGTH,
  XRPLNumber,
  isXRPLNumber,
  MAX_MPT_META_BYTE_LENGTH,
  MPT_META_WARNING_HEADER,
  validateMPTokenMetadata,
} from './common'

/**
 * Enum representing withdrawal strategies for a Vault.
 */
export enum VaultWithdrawalPolicy {
  vaultStrategyFirstComeFirstServe = 0x0001,
}

/**
 * Enum representing values of {@link VaultCreate} transaction flags.
 *
 * @category Transaction Flags
 */
export enum VaultCreateFlags {
  tfVaultPrivate = 0x00010000,
  tfVaultShareNonTransferable = 0x00020000,
}

/**
 * Map of flags to boolean values representing {@link VaultCreate} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface VaultCreateFlagsInterface extends GlobalFlagsInterface {
  tfVaultPrivate?: boolean
  tfVaultShareNonTransferable?: boolean
}

/**
 * The VaultCreate transaction creates a new Vault object.
 *
 * @category Transaction Models
 */
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

  /**
   * The maximum asset amount that can be held in a vault.
   */
  AssetsMaximum?: XRPLNumber

  /**
   * Arbitrary metadata about the share MPT, in hex format, limited to 1024 bytes.
   *
   * The decoded value must be a UTF-8 encoded JSON object that adheres to the
   * XLS-89d MPTokenMetadata standard.
   *
   * While adherence to the XLS-89d format is not mandatory, non-compliant metadata
   * may not be discoverable by ecosystem tools such as explorers and indexers.
   */
  MPTokenMetadata?: string

  /**
   * Indicates the withdrawal strategy used by the Vault.
   */
  WithdrawalPolicy?: number

  /**
   * The PermissionedDomain object ID associated with the shares of this Vault.
   */
  DomainID?: string
}

/* eslint-disable max-lines-per-function -- Not needed to reduce function */
/* eslint-disable max-statements -- required to do all field validations */
/**
 * Verify the form and type of an {@link VaultCreate} at runtime.
 *
 * @param tx - A {@link VaultCreate} Transaction.
 * @throws When the {@link VaultCreate} is malformed.
 */
export function validateVaultCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Asset', isCurrency)
  validateOptionalField(tx, 'Data', isString)
  validateOptionalField(tx, 'AssetsMaximum', isXRPLNumber)
  validateOptionalField(tx, 'MPTokenMetadata', isString)
  validateOptionalField(tx, 'WithdrawalPolicy', isNumber)
  validateOptionalField(tx, 'DomainID', isString)

  if (tx.Data !== undefined) {
    const dataHex = tx.Data
    if (!isHex(dataHex)) {
      throw new ValidationError('VaultCreate: Data must be a valid hex string')
    }
    const dataByteLength = dataHex.length / 2
    if (dataByteLength > VAULT_DATA_MAX_BYTE_LENGTH) {
      throw new ValidationError(
        `VaultCreate: Data exceeds ${VAULT_DATA_MAX_BYTE_LENGTH} bytes (actual: ${dataByteLength})`,
      )
    }
  }

  if (tx.MPTokenMetadata !== undefined) {
    const metaHex = tx.MPTokenMetadata
    if (!isHex(metaHex)) {
      throw new ValidationError(
        'VaultCreate: MPTokenMetadata must be a valid non-empty hex string',
      )
    }
    const metaByteLength = metaHex.length / 2
    if (metaByteLength > MAX_MPT_META_BYTE_LENGTH) {
      throw new ValidationError(
        `VaultCreate: MPTokenMetadata exceeds ${MAX_MPT_META_BYTE_LENGTH} bytes (actual: ${metaByteLength})`,
      )
    }
  }

  // If DomainID present, tfVaultPrivate must be set
  if (
    tx.DomainID !== undefined &&
    !hasFlag(tx, VaultCreateFlags.tfVaultPrivate, 'tfVaultPrivate')
  ) {
    throw new ValidationError(
      'VaultCreate: Cannot set DomainID unless tfVaultPrivate flag is set.',
    )
  }

  if (tx.MPTokenMetadata != null) {
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
/* eslint-enable max-lines-per-function */
/* eslint-enable max-statements */
