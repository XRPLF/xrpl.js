import { ValidationError } from '../../errors'
import { Sidechain } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * A XChainSeqNumCreate transaction assigns, changes, or removes the regular key
 * pair associated with an account.
 *
 * @category Transaction Models
 */
export interface XChainSeqNumCreate extends BaseTransaction {
  TransactionType: 'XChainSeqNumCreate'

  Sidechain: Sidechain
}

/**
 * Verify the form and type of a XChainSeqNumCreate at runtime.
 *
 * @param tx - A XChainSeqNumCreate Transaction.
 * @throws When the XChainSeqNumCreate is malformed.
 */
export function validateXChainSeqNumCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Sidechain !== undefined && typeof tx.Sidechain !== 'object') {
    throw new ValidationError('XChainSeqNumCreate: Sidechain must be an object')
  }
}
