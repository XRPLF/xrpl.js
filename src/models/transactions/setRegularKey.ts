import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

export interface SetRegularKey extends BaseTransaction {
  TransactionType: 'SetRegularKey'
  RegularKey?: string
}

/**
 * Verify the form and type of a SetRegularKey at runtime.
 *
 * @param tx - A SetRegularKey Transaction.
 * @throws When the SetRegularKey is malformed.
 */
export function validateSetRegularKey(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.RegularKey !== undefined && typeof tx.RegularKey !== 'string') {
    throw new ValidationError('SetRegularKey: RegularKey must be a string')
  }
}
