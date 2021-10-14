import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * Cancels an unredeemed Check, removing it from the ledger without sending any
 * money. The source or the destination of the check can cancel a Check at any
 * time using this transaction type. If the Check has expired, any address can
 * cancel it.
 *
 * @category Transaction Models
 */
export interface CheckCancel extends BaseTransaction {
  TransactionType: 'CheckCancel'
  /**
   * The ID of the Check ledger object to cancel as a 64-character hexadecimal
   * string.
   */
  CheckID: string
}

/**
 * Verify the form and type of an CheckCancel at runtime.
 *
 * @param tx - An CheckCancel Transaction.
 * @throws When the CheckCancel is Malformed.
 */
export function validateCheckCancel(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.CheckID !== undefined && typeof tx.CheckID !== 'string') {
    throw new ValidationError('CheckCancel: invalid CheckID')
  }
}
