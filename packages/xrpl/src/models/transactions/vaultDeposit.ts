import { Amount, MPTAmount } from '../common'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateRequiredField,
  isString,
  isAmount,
} from './common'

/**
 * The VaultDeposit transaction adds liqudity in exchange for vault shares.
 *
 * @category Transaction Models
 */
export interface VaultDeposit extends BaseTransaction {
  TransactionType: 'VaultDeposit'

  /**
   * The ID of the vault to which the assets are deposited.
   */
  VaultID: string

  /**
   * Asset amount to deposit.
   */
  // TODO: remove MPTAmount when MPTv2 is released
  Amount: Amount | MPTAmount
}

/**
 * Verify the form and type of a {@link VaultDeposit} at runtime.
 *
 * @param tx - A {@link VaultDeposit} Transaction.
 * @throws When the {@link VaultDeposit} is malformed.
 */
export function validateVaultDeposit(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'VaultID', isString)
  validateRequiredField(tx, 'Amount', isAmount)
}
