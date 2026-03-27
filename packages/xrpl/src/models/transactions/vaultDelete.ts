import {
  BaseTransaction,
  validateBaseTransaction,
  validateRequiredField,
  isString,
} from './common'

/**
 * The VaultDelete transaction deletes an existing vault object.
 *
 * @category Transaction Models
 */
export interface VaultDelete extends BaseTransaction {
  TransactionType: 'VaultDelete'

  /**
   * The ID of the vault to be deleted.
   */
  VaultID: string
}

/**
 * Verify the form and type of a {@link VaultDelete} at runtime.
 *
 * @param tx - A {@link VaultDelete} Transaction.
 * @throws When the {@link VaultDelete} is malformed.
 */
export function validateVaultDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'VaultID', isString)
}
