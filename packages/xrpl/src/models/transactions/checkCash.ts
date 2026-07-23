import { ValidationError } from '../../errors'
import { Amount } from '../common'

import {
  BaseTransaction,
  validateBaseTransaction,
  isAmount,
  validateRequiredField,
  validateOptionalField,
  isHexString,
} from './common'

/**
 * Attempts to redeem a Check object in the ledger to receive up to the amount
 * authorized by the corresponding CheckCreate transaction. Only the Destination
 * address of a Check can cash it with a CheckCash transaction.
 *
 * @category Transaction Models
 */
export interface CheckCash extends BaseTransaction {
  TransactionType: 'CheckCash'
  /**
   * The ID of the Check ledger object to cash as a 64-character hexadecimal
   * string.
   */
  CheckID: string
  /**
   * Redeem the Check for exactly this amount, if possible. The currency must
   * match that of the SendMax of the corresponding CheckCreate transaction. You.
   * must provide either this field or DeliverMin.
   */
  Amount?: Amount
  /**
   * Redeem the Check for at least this amount and for as much as possible. The
   * currency must match that of the SendMax of the corresponding CheckCreate.
   * transaction. You must provide either this field or Amount.
   */
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

  validateRequiredField(tx, 'CheckID', isHexString)
  validateOptionalField(tx, 'Amount', isAmount)
  validateOptionalField(tx, 'DeliverMin', isAmount)

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
}
