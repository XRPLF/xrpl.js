import { ValidationError } from '../../errors'
import { isHex } from '../utils'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
  isNumber,
  VAULT_DATA_MAX_BYTE_LENGTH,
  XRPLNumber,
  isXRPLNumber,
  isHexString,
  isString,
} from './common'
import { validateVaultFees } from './vaultFees'

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

  /**
   * (VaultContinuousAccrual) The new fee taken from each deposit, in units of 1/10 basis
   * point, between 0 and 50000 inclusive. A raise is refused while any share is outstanding.
   */
  DepositFee?: number

  /**
   * (VaultContinuousAccrual) The new fee taken from each redemption, in units of 1/10
   * basis point, between 0 and 50000 inclusive. A raise is refused while any share is
   * outstanding.
   */
  RedemptionFee?: number

  /**
   * (VaultContinuousAccrual) The new number of seconds after a holder's latest deposit
   * during which the `RedemptionFee` applies to that holder.
   */
  RedemptionPeriod?: number
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
  validateOptionalField(tx, 'Data', isString)
  validateOptionalField(tx, 'AssetsMaximum', isXRPLNumber)
  validateOptionalField(tx, 'DomainID', isHexString)
  validateOptionalField(tx, 'DepositFee', isNumber)
  validateOptionalField(tx, 'RedemptionFee', isNumber)
  validateOptionalField(tx, 'RedemptionPeriod', isNumber)
  validateVaultFees(tx)

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
