import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainClaim extends BaseTransaction {
  TransactionType: 'XChainClaim'

  XChainBridge: XChainBridge

  XChainClaimID: number | string

  Destination: string

  DestinationTag?: number

  Amount: Amount
}

/**
 * Verify the form and type of a XChainClaim at runtime.
 *
 * @param tx - A XChainClaim Transaction.
 * @throws When the XChainClaim is malformed.
 */
export function validateXChainClaim(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.XChainBridge == null) {
    throw new ValidationError('XChainClaim: missing field XChainBridge')
  }

  if (tx.XChainClaimID == null) {
    throw new ValidationError('XChainClaim: missing field XChainClaimID')
  }

  if (tx.Destination == null) {
    throw new ValidationError('XChainClaim: missing field Destination')
  }

  if (tx.Amount == null) {
    throw new ValidationError('XChainClaim: missing field Amount')
  }
}
