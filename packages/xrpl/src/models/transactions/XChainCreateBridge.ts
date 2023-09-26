import { Amount, XChainBridge } from '../common'

import {
  BaseTransaction,
  isAmount,
  isXChainBridge,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * The XChainCreateBridge transaction creates a new {@link Bridge} ledger object
 * and defines a new cross-chain bridge entrance on the chain that the transaction
 * is submitted on. It includes information about door accounts and assets for the
 * bridge.
 *
 * @category Transaction Models
 */
export interface XChainCreateBridge extends BaseTransaction {
  TransactionType: 'XChainCreateBridge'

  /**
   * The bridge (door accounts and assets) to create.
   */
  XChainBridge: XChainBridge

  /**
   * The total amount to pay the witness servers for their signatures. This amount
   * will be split among the signers.
   */
  SignatureReward: Amount

  /**
   * The minimum amount, in XRP, required for a {@link XChainAccountCreateCommit}
   * transaction. If this isn't present, the {@link XChainAccountCreateCommit}
   * transaction will fail. This field can only be present on XRP-XRP bridges.
   */
  MinAccountCreateAmount?: Amount
}

/**
 * Verify the form and type of an XChainCreateBridge at runtime.
 *
 * @param tx - An XChainCreateBridge Transaction.
 * @throws When the XChainCreateBridge is malformed.
 */
export function validateXChainCreateBridge(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'XChainBridge', isXChainBridge)

  validateRequiredField(tx, 'SignatureReward', isAmount)

  validateOptionalField(tx, 'MinAccountCreateAmount', isAmount)
}
