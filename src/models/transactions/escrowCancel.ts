import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * Return escrowed XRP to the sender.
 *
 * @category Transaction Models
 */
export interface EscrowCancel extends BaseTransaction {
  TransactionType: 'EscrowCancel'
  /** Address of the source account that funded the escrow payment. */
  Owner: string
  /**
   * Transaction sequence (or Ticket  number) of EscrowCreate transaction that.
   * created the escrow to cancel.
   */
  OfferSequence: number
}

/**
 * Verify the form and type of an EscrowCancel at runtime.
 *
 * @param tx - An EscrowCancel Transaction.
 * @throws When the EscrowCancel is Malformed.
 */
export function validateEscrowCancel(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Owner === undefined) {
    throw new ValidationError('EscrowCancel: missing Owner')
  }

  if (typeof tx.Owner !== 'string') {
    throw new ValidationError('EscrowCancel: Owner must be a string')
  }

  if (tx.OfferSequence === undefined) {
    throw new ValidationError('EscrowCancel: missing OfferSequence')
  }

  if (typeof tx.OfferSequence !== 'number') {
    throw new ValidationError('EscrowCancel: OfferSequence must be a number')
  }
}
