import { ValidationError } from '../../errors'
import { Amount, Bridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainCommit extends BaseTransaction {
  TransactionType: 'XChainCommit'

  Bridge: Bridge

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

  if (tx.Bridge == null) {
    throw new ValidationError('XChainCommit: missing field Bridge')
  }

  if (tx.XChainCommitID == null) {
    throw new ValidationError('XChainCommit: missing field XChainClaimID')
  }

  if (tx.Amount == null) {
    throw new ValidationError('XChainCommit: missing field Amount')
  }
}
