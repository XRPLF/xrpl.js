import { Amount, XChainBridge } from '../common'

import {
  Account,
  BaseTransaction,
  isAccount,
  isAmount,
  isXChainBridge,
  validateBaseTransaction,
  validateRequiredField,
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
  OtherChainSource: Account
}

/**
 * Verify the form and type of an XChainCreateClaimID at runtime.
 *
 * @param tx - An XChainCreateClaimID Transaction.
 * @throws When the XChainCreateClaimID is malformed.
 */
export function validateXChainCreateClaimID(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'XChainBridge', isXChainBridge)

  validateRequiredField(tx, 'SignatureReward', isAmount)

  validateRequiredField(tx, 'OtherChainSource', isAccount)
}
