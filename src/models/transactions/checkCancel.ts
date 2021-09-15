import { ValidationError } from '../../common/errors'

import { BaseTransaction, validateBaseTransaction } from './common'

export interface CheckCancel extends BaseTransaction {
  TransactionType: 'CheckCancel'
  CheckID: string
}

/**
 * Verify the form and type of an CheckCancel at runtime.
 *
 * @param tx - An CheckCancel Transaction.
 * @throws When the CheckCancel is Malformed.
 */
export function validateCheckCancel(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.CheckID !== undefined && typeof tx.CheckID !== 'string') {
    throw new ValidationError('CheckCancel: invalid CheckID')
  }
}
