import { ValidationError } from '../../errors'
import { Currency } from '../common'

import {
  BaseTransaction,
  isIssuedCurrency,
  validateBaseTransaction,
} from './common'

/**
 * Delete an empty Automated Market Maker (AMM) instance that could not be fully deleted automatically.
 *
 * Tip: The AMMWithdraw transaction automatically tries to delete an AMM, along with associated ledger
 * entries such as empty trust lines, if it withdrew all the assets from the AMM's pool.
 * However, if there are too many trust lines to the AMM account to remove in one transaction,
 * it may stop before fully removing the AMM. Similarly, an AMMDelete transaction removes up to
 * a maximum number of trust lines; in extreme cases, it may take several AMMDelete transactions
 * to fully delete the trust lines and the associated AMM.
 * In all cases, the AMM ledger entry and AMM account are deleted by the last such transaction.
 */
export interface AMMDelete extends BaseTransaction {
  TransactionType: 'AMMDelete'

  /**
   * The definition for one of the assets in the AMM's pool.
   */
  Asset: Currency

  /**
   * The definition for the other asset in the AMM's pool.
   */
  Asset2: Currency
}

/**
 * Verify the form and type of an AMMDelete at runtime.
 *
 * @param tx - An AMMDelete Transaction.
 * @throws When the AMMDelete is Malformed.
 */
export function validateAMMDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Asset == null) {
    throw new ValidationError('AMMDelete: missing field Asset')
  }

  if (!isIssuedCurrency(tx.Asset)) {
    throw new ValidationError('AMMDelete: Asset must be a Currency')
  }

  if (tx.Asset2 == null) {
    throw new ValidationError('AMMDelete: missing field Asset2')
  }

  if (!isIssuedCurrency(tx.Asset2)) {
    throw new ValidationError('AMMDelete: Asset2 must be a Currency')
  }
}
