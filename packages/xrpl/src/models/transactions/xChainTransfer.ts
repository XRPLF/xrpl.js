import { ValidationError } from '../../errors'
import { Sidechain } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * A XChainTransfer transaction assigns, changes, or removes the regular key
 * pair associated with an account.
 *
 * @category Transaction Models
 */
export interface XChainTransfer extends BaseTransaction {
  TransactionType: 'XChainTransfer'

  Sidechain: Sidechain

  XChainSequence: 1
}

/**
 * Verify the form and type of a XChainTransfer at runtime.
 *
 * @param tx - A XChainTransfer Transaction.
 * @throws When the XChainTransfer is malformed.
 */
export function validateXChainTransfer(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Sidechain !== undefined && typeof tx.Sidechain !== 'object') {
    throw new ValidationError('XChainTransfer: Sidechain must be an object')
  }

  if (tx.XChainSequence === undefined) {
    throw new ValidationError('EscrowCancel: missing XChainSequence')
  }

  if (typeof tx.XChainSequence !== 'number') {
    throw new ValidationError('EscrowCancel: XChainSequence must be a number')
  }
}
