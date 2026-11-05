import {
  Account,
  BaseTransaction,
  isAccount,
  isNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * The PerpOrderCancel transaction cancels one resting perpetual futures order.
 * Another owner's order may be cancelled only when its market is settled or
 * the order has expired.
 *
 * @category Transaction Models
 */
export interface PerpOrderCancel extends BaseTransaction {
  TransactionType: 'PerpOrderCancel'

  /** The Sequence of the PerpOrder to cancel. */
  OfferSequence: number

  /** The owner of the order. Defaults to the submitting Account. */
  Owner?: Account
}

/**
 * Verify the form and type of a {@link PerpOrderCancel} at runtime.
 *
 * @param tx - A {@link PerpOrderCancel} Transaction.
 * @throws When the {@link PerpOrderCancel} is malformed.
 */
export function validatePerpOrderCancel(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'OfferSequence', isNumber)
  validateOptionalField(tx, 'Owner', isAccount)
}
