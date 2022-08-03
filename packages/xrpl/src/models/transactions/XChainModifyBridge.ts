import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainModifyBridge extends BaseTransaction {
  TransactionType: 'XChainModifyBridge'

  XChainBridge: XChainBridge

  SignatureReward: Amount

  MinAccountCreateAmount?: Amount
}

/**
 * Verify the form and type of a XChainModifyBridge at runtime.
 *
 * @param tx - A XChainModifyBridge Transaction.
 * @throws When the XChainModifyBridge is malformed.
 */
export function validateXChainModifyBridge(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.XChainBridge == null) {
    throw new ValidationError('XChainModifyBridge: missing field XChainBridge')
  }

  if (tx.SignatureReward == null) {
    throw new ValidationError(
      'XChainModifyBridge: missing field SignatureReward',
    )
  }
}
