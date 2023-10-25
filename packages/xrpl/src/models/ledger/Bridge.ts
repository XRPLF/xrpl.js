import { Amount, XChainBridge } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * A Bridge objects represents a cross-chain bridge and includes information about
 * the door accounts, assets, signature rewards, and the minimum account create
 * amount.
 *
 * @category Ledger Entries
 */
export default interface Bridge extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Bridge'

  /** The door account that owns the bridge. */
  Account: string

  /**
   * The total amount, in XRP, to be rewarded for providing a signature for
   * cross-chain transfer or for signing for the cross-chain reward. This amount
   * will be split among the signers.
   */
  SignatureReward: Amount

  /**
   * The door accounts and assets of the bridge this object correlates to.
   */
  XChainBridge: XChainBridge

  /**
   * The value of the next XChainClaimID to be created.
   */
  XChainClaimID: string

  /**
   * A counter used to order the execution of account create transactions. It is
   * incremented every time a successful {@link XChainAccountCreateCommit}
   * transaction is run for the source chain.
   */
  XChainAccountCreateCount: string

  /**
   * A counter used to order the execution of account create transactions. It is
   * incremented every time a {@link XChainAccountCreateCommit} transaction is
   * "claimed" on the destination chain. When the "claim" transaction is run on
   * the destination chain, the XChainAccountClaimCount must match the value that
   * the XChainAccountCreateCount had at the time the XChainAccountClaimCount was
   * run on the source chain. This orders the claims so that they run in the same
   * order that the XChainAccountCreateCommit transactions ran on the source chain,
   * to prevent transaction replay.
   */
  XChainAccountClaimCount: string

  /**
   * The minimum amount, in XRP, required for an {@link XChainAccountCreateCommit}
   * transaction. If this isn't present, the {@link XChainAccountCreateCommit}
   * transaction will fail. This field can only be present on XRP-XRP bridges.
   */
  MinAccountCreateAmount?: string

  /**
   * A bit-map of boolean flags. No flags are defined for Bridges, so this value
   * is always 0.
   */
  Flags: 0

  /**
   * A hint indicating which page of the sender's owner directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
}
