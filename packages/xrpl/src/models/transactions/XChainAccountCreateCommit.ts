import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainAccountCreateCommit extends BaseTransaction {
  TransactionType: 'XChainAccountCreateCommit'

  XChainBridge: XChainBridge

  SignatureReward: number | string

  Destination: string

  Amount: Amount
}

/**
 * Verify the form and type of a XChainAccountCreateCommit at runtime.
 *
 * @param tx - A XChainAccountCreateCommit Transaction.
 * @throws When the XChainAccountCreateCommit is malformed.
 */
export function validateXChainAccountCreateCommit(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  if (tx.XChainBridge == null) {
    throw new ValidationError(
      'XChainAccountCreateCommit: missing field XChainBridge',
    )
  }

  if (tx.SignatureReward == null) {
    throw new ValidationError(
      'XChainAccountCreateCommit: missing field SignatureReward',
    )
  }

  if (tx.Destination == null) {
    throw new ValidationError(
      'XChainAccountCreateCommit: missing field Destination',
    )
  }

  if (tx.Amount == null) {
    throw new ValidationError('XChainAccountCreateCommit: missing field Amount')
  }
}
