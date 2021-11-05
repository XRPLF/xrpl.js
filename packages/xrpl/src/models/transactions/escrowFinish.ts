import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * Deliver XRP from a held payment to the recipient.
 *
 * @category Transaction Models
 */
export interface EscrowFinish extends BaseTransaction {
  TransactionType: 'EscrowFinish'
  /** Address of the source account that funded the held payment. */
  Owner: string
  /**
   * Transaction sequence of EscrowCreate transaction that created the held.
   * payment to finish.
   */
  OfferSequence: number
  /**
   * Hex value matching the previously-supplied PREIMAGE-SHA-256.
   * crypto-condition of the held payment.
   */
  Condition?: string
  /**
   * Hex value of the PREIMAGE-SHA-256 crypto-condition fulfillment matching.
   * the held payment's Condition.
   */
  Fulfillment?: string
}

/**
 * Verify the form and type of an EscrowFinish at runtime.
 *
 * @param tx - An EscrowFinish Transaction.
 * @throws When the EscrowFinish is Malformed.
 */
export function validateEscrowFinish(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Owner === undefined) {
    throw new ValidationError('EscrowFinish: missing field Owner')
  }

  if (typeof tx.Owner !== 'string') {
    throw new ValidationError('EscrowFinish: Owner must be a string')
  }

  if (tx.OfferSequence === undefined) {
    throw new ValidationError('EscrowFinish: missing field OfferSequence')
  }

  if (typeof tx.OfferSequence !== 'number') {
    throw new ValidationError('EscrowFinish: OfferSequence must be a number')
  }

  if (tx.Condition !== undefined && typeof tx.Condition !== 'string') {
    throw new ValidationError('EscrowFinish: Condition must be a string')
  }

  if (tx.Fulfillment !== undefined && typeof tx.Fulfillment !== 'string') {
    throw new ValidationError('EscrowFinish: Fulfillment must be a string')
  }
}
