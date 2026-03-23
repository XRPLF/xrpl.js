import { ValidationError } from '../../errors'
import { isHex } from '../utils'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
  isString,
  VAULT_DATA_MAX_BYTE_LENGTH,
  XRPLNumber,
  isXRPLNumber,
} from './common'

/**
 * The VaultSet transaction modifies mutable fields on an existing Vault object.
 *
 * @category Transaction Models
 */
export interface VaultSet extends BaseTransaction {
  TransactionType: 'VaultSet'

  /**
   * The ID of the Vault to be modified. Must be included when updating the Vault.
   */
  VaultID: string

  /**
   * Arbitrary Vault metadata, limited to 256 bytes.
   */
  Data?: string

  /**
   * The maximum asset amount that can be held in a vault. The value cannot be lower than the
   * current AssetsTotal unless the value is 0.
   */
  AssetsMaximum?: XRPLNumber

  /**
   * The PermissionedDomain object ID associated with the shares of this Vault.
   */
  DomainID?: string
}

/**
 * Verify the form and type of a {@link VaultSet} at runtime.
 *
 * @param tx - A {@link VaultSet} Transaction.
 * @throws When the {@link VaultSet} is malformed.
 */
export function validateVaultSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'VaultID', isString)
  validateOptionalField(tx, 'Data', isString)
  validateOptionalField(tx, 'AssetsMaximum', isXRPLNumber)
  validateOptionalField(tx, 'DomainID', isString)

  if (tx.Data !== undefined) {
    const dataHex = tx.Data
    if (!isHex(dataHex)) {
      throw new ValidationError('VaultSet: Data must be a valid hex string')
    }
    const dataByteLength = dataHex.length / 2
    if (dataByteLength > VAULT_DATA_MAX_BYTE_LENGTH) {
      throw new ValidationError(
        `VaultSet: Data exceeds ${VAULT_DATA_MAX_BYTE_LENGTH} bytes (actual: ${dataByteLength})`,
      )
    }
  }
}
