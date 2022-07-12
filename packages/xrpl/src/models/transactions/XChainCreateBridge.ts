import { ValidationError } from '../../errors'
import { Amount, Bridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainCreateBridge extends BaseTransaction {
  TransactionType: 'XChainCreateBridge'

  Bridge: Bridge

  SignatureReward: Amount

  MinAccountCreateAmount?: Amount
}

/**
 * Verify the form and type of a XChainCreateBridge at runtime.
 *
 * @param tx - A XChainCreateBridge Transaction.
 * @throws When the XChainCreateBridge is malformed.
 */
export function validateXChainCreateBridge(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Bridge == null) {
    throw new ValidationError('XChainCreateBridge: missing field Bridge')
  }

  if (tx.SignatureReward == null) {
    throw new ValidationError(
      'XChainCreateBridge: missing field SignatureReward',
    )
  }
}
