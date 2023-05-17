import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 *
 * @category Transaction Models
 */
export interface Invoke extends BaseTransaction {
  TransactionType: 'Invoke'
  /**
   * If present, invokes the Hook on the Destination account.
   */
  Destination?: string
  /**
   * Hex value representing a VL Blob.
   */
  Blob?: string
}

/**
 * Verify the form and type of an Invoke at runtime.
 *
 * @param tx - An Invoke Transaction.
 * @throws When the Invoke is Malformed.
 */
export function validateInvoke(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Account === tx.Destination) {
    throw new ValidationError(
      'Invoke: Destination and Account must not be equal',
    )
  }
}
