import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import {
  BaseTransaction,
  isAmount,
  isXChainBridge,
  validateBaseTransaction,
} from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainCommit extends BaseTransaction {
  TransactionType: 'XChainCommit'

  XChainBridge: XChainBridge

  XChainClaimID: number | string

  OtherChainDestination?: string

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

  if (!isXChainBridge(tx.XChainBridge)) {
    throw new ValidationError('XChainCommit: invalid field XChainBridge')
  }

  if (tx.XChainClaimID == null) {
    throw new ValidationError('XChainCommit: missing field XChainClaimID')
  }

  if (
    typeof tx.XChainClaimID !== 'number' &&
    typeof tx.XChainClaimID !== 'string'
  ) {
    throw new ValidationError('XChainCommit: invalid field XChainClaimID')
  }

  if (
    tx.OtherChainDestination !== undefined &&
    typeof tx.OtherChainDestination !== 'string'
  ) {
    throw new ValidationError(
      'XChainCommit: invalid field OtherChainDestination',
    )
  }

  if (tx.Amount == null) {
    throw new ValidationError('XChainCommit: missing field Amount')
  }

  if (!isAmount(tx.Amount)) {
    throw new ValidationError('XChainCommit: invalid field Amount')
  }
}
