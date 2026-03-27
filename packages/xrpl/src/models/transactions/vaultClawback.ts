import { ClawbackAmount } from '../common'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateRequiredField,
  isString,
  Account,
  isAccount,
  validateOptionalField,
  isClawbackAmount,
} from './common'

/**
 * The VaultClawback transaction performs a Clawback from the Vault, exchanging the shares of an account.
 *
 * Conceptually, the transaction performs VaultWithdraw on behalf of the Holder, sending the funds to the
 * Issuer account of the asset. In case there are insufficient funds for the entire Amount the transaction
 * will perform a partial Clawback, up to the Vault.AssetsAvailable. The Clawback transaction must respect
 * any future fees or penalties.
 *
 * @category Transaction Models
 */
export interface VaultClawback extends BaseTransaction {
  TransactionType: 'VaultClawback'

  /**
   * The ID of the vault from which assets are withdrawn.
   */
  VaultID: string

  /**
   * The account ID from which to clawback the assets.
   */
  Holder: Account

  /**
   * The asset amount to clawback. When Amount is 0 clawback all funds, up to the total shares the Holder owns.
   */
  Amount?: ClawbackAmount
}

/**
 * Verify the form and type of a {@link VaultClawback} at runtime.
 *
 * @param tx - A {@link VaultClawback} Transaction.
 * @throws When the {@link VaultClawback} is malformed.
 */
export function validateVaultClawback(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'VaultID', isString)
  validateRequiredField(tx, 'Holder', isAccount)
  validateOptionalField(tx, 'Amount', isClawbackAmount)
}
