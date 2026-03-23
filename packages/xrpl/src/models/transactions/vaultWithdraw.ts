import { Amount, MPTAmount } from '../common'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateRequiredField,
  isString,
  isAmount,
  Account,
  validateOptionalField,
  isAccount,
} from './common'

/**
 * The VaultWithdraw transaction withdraws assets in exchange for the vault's shares.
 *
 * @category Transaction Models
 */
export interface VaultWithdraw extends BaseTransaction {
  TransactionType: 'VaultWithdraw'

  /**
   * The ID of the vault from which assets are withdrawn.
   */
  VaultID: string

  /**
   * The exact amount of Vault asset to withdraw.
   */
  // TODO: remove MPTAmount when MPTv2 is released
  Amount: Amount | MPTAmount

  /**
   * An account to receive the assets. It must be able to receive the asset.
   */
  Destination?: Account
}

/**
 * Verify the form and type of a {@link VaultWithdraw} at runtime.
 *
 * @param tx - A {@link VaultWithdraw} Transaction.
 * @throws When the {@link VaultWithdraw} is malformed.
 */
export function validateVaultWithdraw(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'VaultID', isString)
  validateRequiredField(tx, 'Amount', isAmount)
  validateOptionalField(tx, 'Destination', isAccount)
}
