import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import {
  BaseTransaction,
  isAmount,
  isXChainBridge,
  validateBaseTransaction,
} from './common'

/**
 * The XChainCreateClaimID transaction creates a new cross-chain claim ID that is
 * used for a cross-chain transfer. A cross-chain claim ID represents one
 * cross-chain transfer of value.
 *
 * @category Transaction Models
 */
export interface XChainCreateClaimID extends BaseTransaction {
  TransactionType: 'XChainCreateClaimID'

  /**
   * The bridge to create the claim ID for.
   */
  XChainBridge: XChainBridge

  /**
   * The amount, in XRP, to reward the witness servers for providing signatures.
   * This must match the amount on the {@link Bridge} ledger object.
   */
  SignatureReward: Amount

  /**
   * The account that must send the {@link XChainCommit} transaction on the source chain.
   */
  OtherChainSource: string
}

/**
 * Verify the form and type of an XChainCreateClaimID at runtime.
 *
 * @param tx - An XChainCreateClaimID Transaction.
 * @throws When the XChainCreateClaimID is malformed.
 */
export function validateXChainCreateClaimID(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.XChainBridge == null) {
    throw new ValidationError('XChainCreateClaimID: missing field XChainBridge')
  }

  if (!isXChainBridge(tx.XChainBridge)) {
    throw new ValidationError('XChainCreateClaimID: invalid field XChainBridge')
  }

  if (tx.SignatureReward == null) {
    throw new ValidationError(
      'XChainCreateClaimID: missing field SignatureReward',
    )
  }

  if (!isAmount(tx.SignatureReward)) {
    throw new ValidationError(
      'XChainCreateClaimID: invalid field SignatureReward',
    )
  }

  if (tx.OtherChainSource == null) {
    throw new ValidationError(
      'XChainCreateClaimID: missing field OtherChainSource',
    )
  }

  if (typeof tx.OtherChainSource !== 'string') {
    throw new ValidationError(
      'XChainCreateClaimID: invalid field OtherChainSource',
    )
  }
}
