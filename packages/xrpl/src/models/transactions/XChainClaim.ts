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
// eslint-disable-next-line complexity -- okay for this function, lots of things to check
export function validateXChainClaim(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.XChainBridge == null) {
    throw new ValidationError('XChainClaim: missing field XChainBridge')
  }

  if (!isXChainBridge(tx.XChainBridge)) {
    throw new ValidationError('XChainClaim: invalid field XChainBridge')
  }

  if (tx.XChainClaimID == null) {
    throw new ValidationError('XChainClaim: missing field XChainClaimID')
  }

  if (
    typeof tx.XChainClaimID !== 'number' &&
    typeof tx.XChainClaimID !== 'string'
  ) {
    throw new ValidationError('XChainClaim: invalid field XChainClaimID')
  }

  if (tx.Destination == null) {
    throw new ValidationError('XChainClaim: missing field Destination')
  }

  if (typeof tx.Destination !== 'string') {
    throw new ValidationError('XChainClaim: invalid field Destination')
  }

  if (
    tx.DestinationTag !== undefined &&
    typeof tx.DestinationTag !== 'number'
  ) {
    throw new ValidationError('XChainClaim: invalid field DestinationTag')
  }

  if (tx.Amount == null) {
    throw new ValidationError('XChainClaim: missing field Amount')
  }

  if (!isAmount(tx.Amount)) {
    throw new ValidationError('XChainClaim: invalid field Amount')
  }
}
