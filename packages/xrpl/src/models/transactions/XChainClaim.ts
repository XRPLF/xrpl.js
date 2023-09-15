import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import {
  BaseTransaction,
  isAmount,
  isXChainBridge,
  validateBaseTransaction,
} from './common'

/**
 * The XChainClaim transaction completes a cross-chain transfer of value. It
 * allows a user to claim the value on the destination chain - the equivalent
 * of the value locked on the source chain.
 *
 * @category Transaction Models
 */
export interface XChainClaim extends BaseTransaction {
  TransactionType: 'XChainClaim'

  /**
   * The bridge to use for the transfer.
   */
  XChainBridge: XChainBridge

  /**
   * The unique integer ID for the cross-chain transfer that was referenced in the
   * corresponding {@link XChainCommit} transaction.
   */
  XChainClaimID: number | string

  /**
   * The destination account on the destination chain. It must exist or the
   * transaction will fail. However, if the transaction fails in this case, the
   * sequence number and collected signatures won't be destroyed, and the
   * transaction can be rerun with a different destination.
   */
  Destination: string

  /**
   * An integer destination tag.
   */
  DestinationTag?: number

  /**
   * The amount to claim on the destination chain. This must match the amount
   * attested to on the attestations associated with this XChainClaimID.
   */
  Amount: Amount
}

/**
 * Verify the form and type of an XChainClaim at runtime.
 *
 * @param tx - An XChainClaim Transaction.
 * @throws When the XChainClaim is malformed.
 */
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
