import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
  VAULT_DATA_MAX_BYTE_LENGTH,
  XRPLNumber,
  isXRPLNumber,
  isHexString,
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

  validateRequiredField(tx, 'VaultID', isHexString)
  validateOptionalField(tx, 'Data', isHexString)
  validateOptionalField(tx, 'AssetsMaximum', isXRPLNumber)
  validateOptionalField(tx, 'DomainID', isHexString)

  if (tx.Data !== undefined) {
    const dataHex = tx.Data
    const dataByteLength = dataHex.length / 2
    if (dataByteLength > VAULT_DATA_MAX_BYTE_LENGTH) {
      throw new ValidationError(
        `VaultSet: Data exceeds ${VAULT_DATA_MAX_BYTE_LENGTH} bytes (actual: ${dataByteLength})`,
      )
    }
  }
}
