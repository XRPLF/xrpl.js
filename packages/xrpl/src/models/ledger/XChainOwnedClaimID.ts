import { XChainBridge } from '../common'

import BaseLedgerEntry from './BaseLedgerEntry'

export default interface XChainOwnedClaimID extends BaseLedgerEntry {
  LedgerEntryType: 'XChainOwnedClaimID'

  Account: string

  XChainBridge: XChainBridge

  XChainClaimID: string

  OtherChainSource: string
  // TODO: type this better
  XChainClaimAttestations: object[]

  SignatureReward: string

  /**
   * A bit-map of boolean flags. No flags are defined for XChainOwnedClaimIDs,
   * so this value is always 0.
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
