import { ValidationError } from '../../errors'

import {
  Account,
  BaseTransaction,
  isAccount,
  validateBaseTransaction,
  validateCredentialsList,
  validateRequiredField,
} from './common'

/**
 * Deliver XRP from a held payment to the recipient.
 *
 * @category Transaction Models
 */
export interface EscrowFinish extends BaseTransaction {
  TransactionType: 'EscrowFinish'
  /** Address of the source account that funded the held payment. */
  Owner: Account
  /**
   * Transaction sequence of EscrowCreate transaction that created the held.
   * payment to finish.
   */
  OfferSequence: number | string
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
  /** Credentials associated with the sender of this transaction.
   * The credentials included must not be expired.
   */
  CredentialIDs?: string[]
}

/**
 * Verify the form and type of an EscrowFinish at runtime.
 *
 * @param tx - An EscrowFinish Transaction.
 * @throws When the EscrowFinish is Malformed.
 */
export function validateEscrowFinish(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Owner', isAccount)

  validateCredentialsList(
    tx.CredentialIDs,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- known from base check
    tx.TransactionType as string,
    true,
  )

  if (tx.OfferSequence == null) {
    throw new ValidationError('EscrowFinish: missing field OfferSequence')
  }

  if (
    (typeof tx.OfferSequence !== 'number' &&
      typeof tx.OfferSequence !== 'string') ||
    Number.isNaN(Number(tx.OfferSequence))
  ) {
    throw new ValidationError('EscrowFinish: OfferSequence must be a number')
  }

  if (tx.Condition !== undefined && typeof tx.Condition !== 'string') {
    throw new ValidationError('EscrowFinish: Condition must be a string')
  }

  if (tx.Fulfillment !== undefined && typeof tx.Fulfillment !== 'string') {
    throw new ValidationError('EscrowFinish: Fulfillment must be a string')
  }
}
