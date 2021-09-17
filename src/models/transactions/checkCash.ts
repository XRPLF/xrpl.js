/* eslint-disable complexity -- Necessary for validateCheckCash */
import { ValidationError } from '../../common/errors'
import { Amount } from '../common'

import { BaseTransaction, validateBaseTransaction, isAmount } from './common'

export interface CheckCash extends BaseTransaction {
  TransactionType: 'CheckCash'
  CheckID: string
  Amount?: Amount
  DeliverMin?: Amount
}

/**
 * Verify the form and type of an CheckCash at runtime.
 *
 * @param tx - An CheckCash Transaction.
 * @throws When the CheckCash is Malformed.
 */
export function validateCheckCash(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Amount == null && tx.DeliverMin == null) {
    throw new ValidationError(
      'CheckCash: must have either Amount or DeliverMin',
    )
  }

  if (tx.Amount != null && tx.DeliverMin != null) {
    throw new ValidationError(
      'CheckCash: cannot have both Amount and DeliverMin',
    )
  }

  if (tx.Amount != null && tx.Amount !== undefined && !isAmount(tx.Amount)) {
    throw new ValidationError('CheckCash: invalid Amount')
  }

  if (
    tx.DeliverMin != null &&
    tx.DeliverMin !== undefined &&
    !isAmount(tx.DeliverMin)
  ) {
    throw new ValidationError('CheckCash: invalid DeliverMin')
  }

  if (tx.CheckID !== undefined && typeof tx.CheckID !== 'string') {
    throw new ValidationError('CheckCash: invalid CheckID')
  }
}
