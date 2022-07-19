import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainCreateClaimID extends BaseTransaction {
  TransactionType: 'XChainCreateClaimID'

  XChainBridge: XChainBridge

  SignatureReward: Amount

  OtherChainAccount: string
}

/**
 * Verify the form and type of a XChainCreateClaimID at runtime.
 *
 * @param tx - A XChainCreateClaimID Transaction.
 * @throws When the XChainCreateClaimID is malformed.
 */
export function validateXChainCreateClaimID(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.XChainBridge == null) {
    throw new ValidationError('XChainCreateClaimID: missing field XChainBridge')
  }

  if (tx.SignatureReward == null) {
    throw new ValidationError(
      'XChainCreateClaimID: missing field SignatureReward',
    )
  }

  if (tx.OtherChainAccount == null) {
    throw new ValidationError(
      'XChainCreateClaimID: missing field OtherChainAccount',
    )
  }
}
