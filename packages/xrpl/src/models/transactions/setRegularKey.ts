import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * A SetRegularKey transaction assigns, changes, or removes the regular key
 * pair associated with an account.
 *
 * @category Transaction Models
 */
export interface SetRegularKey extends BaseTransaction {
  TransactionType: 'SetRegularKey'
  /**
   * A base-58-encoded Address that indicates the regular key pair to be
   * assigned to the account. If omitted, removes any existing regular key pair.
   * from the account. Must not match the master key pair for the address.
   */
  RegularKey?: string
}

/**
 * Verify the form and type of a SetRegularKey at runtime.
 *
 * @param tx - A SetRegularKey Transaction.
 * @throws When the SetRegularKey is malformed.
 */
export function validateSetRegularKey(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.RegularKey !== undefined && typeof tx.RegularKey !== 'string') {
    throw new ValidationError('SetRegularKey: RegularKey must be a string')
  }
}
