import { ValidationError } from '../../errors'
import { Currency } from '../common'

import { BaseTransaction, isCurrency, validateBaseTransaction } from './common'

/**
 * TODO: Fill in when docs are ready.
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

  if (!isCurrency(tx.Asset)) {
    throw new ValidationError('AMMDelete: Asset must be an Currency')
  }

  if (tx.Asset2 == null) {
    throw new ValidationError('AMMDelete: missing field Asset2')
  }

  if (!isCurrency(tx.Asset2)) {
    throw new ValidationError('AMMDelete: Asset2 must be an Currency')
  }
}
