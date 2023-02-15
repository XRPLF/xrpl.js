import { XChainBridge } from '../common'

import BaseLedgerEntry from './BaseLedgerEntry'

export default interface XChainOwnedCreateAccountClaimID
  extends BaseLedgerEntry {
  LedgerEntryType: 'XChainOwnedCreateAccountClaimID'

  Account: string

  XChainBridge: XChainBridge

  XChainAccountCreateCount: number
  // TODO: type this better
  XChainCreateAccountAttestations: object[]

  /**
   * A bit-map of boolean flags. No flags are defined for,
   * XChainOwnedCreateAccountClaimIDs, so this value is always 0.
   */
  Flags: 0
  /**
   * A hint indicating which page of the sender's owner directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /**
   * The identifying hash of the transaction that most recently modified this
   * object.
   */
  PreviousTxnID: string
  /**
   * The index of the ledger that contains the transaction that most recently
   * modified this object.
   */
  PreviousTxnLgrSeq: number
}
