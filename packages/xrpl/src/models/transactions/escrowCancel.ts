import { ValidationError } from '../../errors'

import {
  Account,
  BaseTransaction,
  isAccount,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * Return escrowed XRP to the sender.
 *
 * @category Transaction Models
 */
export interface EscrowCancel extends BaseTransaction {
  TransactionType: 'EscrowCancel'
  /** Address of the source account that funded the escrow payment. */
  Owner: Account
  /**
   * Transaction sequence (or Ticket  number) of EscrowCreate transaction that.
   * created the escrow to cancel.
   */
  OfferSequence: number | string
}

/**
 * Verify the form and type of an EscrowCancel at runtime.
 *
 * @param tx - An EscrowCancel Transaction.
 * @throws When the EscrowCancel is Malformed.
 */
export function validateEscrowCancel(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Owner', isAccount)

  if (tx.OfferSequence == null) {
    throw new ValidationError('EscrowCancel: missing OfferSequence')
  }

  if (
    (typeof tx.OfferSequence !== 'number' &&
      typeof tx.OfferSequence !== 'string') ||
    Number.isNaN(Number(tx.OfferSequence))
  ) {
    throw new ValidationError('EscrowCancel: OfferSequence must be a number')
  }
}
