import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

export interface AccountDelete extends BaseTransaction {
  TransactionType: 'AccountDelete'
  Destination: string
  DestinationTag?: number
}

/**
 * Verify the form and type of an AccountDelete at runtime.
 *
 * @param tx - An AccountDelete Transaction.
 * @throws When the AccountDelete is Malformed.
 */
export function validateAccountDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Destination === undefined) {
    throw new ValidationError('AccountDelete: missing field Destination')
  }

  if (typeof tx.Destination !== 'string') {
    throw new ValidationError('AccountDelete: invalid Destination')
  }

  if (
    tx.DestinationTag !== undefined &&
    typeof tx.DestinationTag !== 'number'
  ) {
    throw new ValidationError('AccountDelete: invalid DestinationTag')
  }
}
