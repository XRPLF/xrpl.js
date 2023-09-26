import { Amount, XChainBridge } from '../common'

import {
  BaseTransaction,
  isAmount,
  isXChainBridge,
  validateBaseTransaction,
  validateRequiredField,
  isAccount,
  Account,
} from './common'

/**
 * The XChainAccountCreateCommit transaction creates a new account on one of the
 * chains a bridge connects, which serves as the bridge entrance for that chain.
 *
 * WARNING: This transaction should only be executed if the witness attestations
 * will be reliably delivered to the destination chain. If the signatures aren't
 * delivered, then account creation will be blocked until attestations are received.
 * This can be used maliciously; to disable this transaction on XRP-XRP bridges,
 * the bridge's MinAccountCreateAmount shouldn't be present.
 *
 * @category Transaction Models
 */
export interface XChainAccountCreateCommit extends BaseTransaction {
  TransactionType: 'XChainAccountCreateCommit'

  /**
   * The bridge to create accounts for.
   */
  XChainBridge: XChainBridge

  /**
   * The amount, in XRP, to be used to reward the witness servers for providing
   * signatures. This must match the amount on the {@link Bridge} ledger object.
   */
  SignatureReward: Amount

  /**
   * The destination account on the destination chain.
   */
  Destination: Account

  /**
   * The amount, in XRP, to use for account creation. This must be greater than or
   * equal to the MinAccountCreateAmount specified in the {@link Bridge} ledger object.
   */
  Amount: Amount
}

/**
 * Verify the form and type of an XChainAccountCreateCommit at runtime.
 *
 * @param tx - An XChainAccountCreateCommit Transaction.
 * @throws When the XChainAccountCreateCommit is malformed.
 */
export function validateXChainAccountCreateCommit(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'XChainBridge', isXChainBridge)

  validateRequiredField(tx, 'SignatureReward', isAmount)

  validateRequiredField(tx, 'Destination', isAccount)

  validateRequiredField(tx, 'Amount', isAmount)
}
