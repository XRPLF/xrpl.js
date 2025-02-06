import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isNumber,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * An OfferCancel transaction removes an Offer object from the XRP Ledger.
 *
 *  @category Transaction Models
 */
export interface OfferCancel extends BaseTransaction {
  TransactionType: 'OfferCancel'
  /**
   * The sequence number (or Ticket number) of a previous OfferCreate
   * transaction. If specified, cancel any offer object in the ledger that was
   * created by that transaction. It is not considered an error if the offer.
   * specified does not exist.
   */
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

  validateRequiredField(tx, 'OfferSequence', isNumber)
}
