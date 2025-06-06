import { Amount, XChainBridge } from '../common'

import {
  Account,
  BaseTransaction,
  isAccount,
  isAmount,
  isNumber,
  isString,
  isXChainBridge,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * The XChainCommit is the second step in a cross-chain transfer. It puts assets
 * into trust on the locking chain so that they can be wrapped on the issuing
 * chain, or burns wrapped assets on the issuing chain so that they can be returned
 * on the locking chain.
 *
 * @category Transaction Models
 */
export interface XChainCommit extends BaseTransaction {
  TransactionType: 'XChainCommit'

  /**
   * The bridge to use to transfer funds.
   */
  XChainBridge: XChainBridge

  /**
   * The unique integer ID for a cross-chain transfer. This must be acquired on
   * the destination chain (via a {@link XChainCreateClaimID} transaction) and
   * checked from a validated ledger before submitting this transaction. If an
   * incorrect sequence number is specified, the funds will be lost.
   */
  XChainClaimID: number | string

  /**
   * The destination account on the destination chain. If this is not specified,
   * the account that submitted the {@link XChainCreateClaimID} transaction on the
   * destination chain will need to submit a {@link XChainClaim} transaction to
   * claim the funds.
   */
  OtherChainDestination?: Account

  /**
   * The asset to commit, and the quantity. This must match the door account's
   * LockingChainIssue (if on the locking chain) or the door account's
   * IssuingChainIssue (if on the issuing chain).
   */
  Amount: Amount
}

/**
 * Verify the form and type of an XChainCommit at runtime.
 *
 * @param tx - An XChainCommit Transaction.
 * @throws When the XChainCommit is malformed.
 */
export function validateXChainCommit(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'XChainBridge', isXChainBridge)

  validateRequiredField(
    tx,
    'XChainClaimID',
    (inp: unknown): inp is number | string => isNumber(inp) || isString(inp),
  )

  validateOptionalField(tx, 'OtherChainDestination', isAccount)

  validateRequiredField(tx, 'Amount', isAmount)
}
