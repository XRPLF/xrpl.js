import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * An AccountDelete transaction deletes an account and any objects it owns in
 * the XRP Ledger, if possible, sending the account's remaining XRP to a
 * specified destination account.
 *
 * @category Transaction Models
 */
export interface AccountDelete extends BaseTransaction {
  TransactionType: 'AccountDelete'
  /**
   * The address of an account to receive any leftover XRP after deleting the
   * sending account. Must be a funded account in the ledger, and must not be.
   * the sending account.
   */
  Destination: string
  /**
   * Arbitrary destination tag that identifies a hosted recipient or other.
   * information for the recipient of the deleted account's leftover XRP.
   */
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
