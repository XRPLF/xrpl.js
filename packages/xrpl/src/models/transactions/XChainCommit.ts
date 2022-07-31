import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainCommit extends BaseTransaction {
  TransactionType: 'XChainCommit'

  XChainBridge: XChainBridge

  XChainClaimID: number | string

  Amount: Amount
}

/**
 * Verify the form and type of a XChainCommit at runtime.
 *
 * @param tx - A XChainCommit Transaction.
 * @throws When the XChainCommit is malformed.
 */
export function validateXChainCommit(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.XChainBridge == null) {
    throw new ValidationError('XChainCommit: missing field XChainBridge')
  }

  if (tx.XChainClaimID == null) {
    throw new ValidationError('XChainCommit: missing field XChainClaimID')
  }

  if (tx.Amount == null) {
    throw new ValidationError('XChainCommit: missing field Amount')
  }
}
