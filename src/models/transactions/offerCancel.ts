import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

export interface OfferCancel extends BaseTransaction {
  TransactionType: 'OfferCancel'
  OfferSequence: number
}

/**
 * Verify the form and type of an OfferCancel at runtime.
 *
 * @param tx - An OfferCancel Transaction.
 * @throws When the OfferCancel is Malformed.
 */
export function validateOfferCancel(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.OfferSequence === undefined) {
    throw new ValidationError('OfferCancel: missing field OfferSequence')
  }

  if (typeof tx.OfferSequence !== 'number') {
    throw new ValidationError('OfferCancel: OfferSequence must be a number')
  }
}
