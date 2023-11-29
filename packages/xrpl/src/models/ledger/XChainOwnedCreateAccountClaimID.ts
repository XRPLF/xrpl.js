import { XChainBridge } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The XChainOwnedCreateAccountClaimID ledger object is used to collect attestations
 * for creating an account via a cross-chain transfer.
 *
 * @category Ledger Entries
 */
export default interface XChainOwnedCreateAccountClaimID
  extends BaseLedgerEntry,
    HasPreviousTxnID {
  LedgerEntryType: 'XChainOwnedCreateAccountClaimID'

  /** The account that owns this object. */
  Account: string

  /**
   * The door accounts and assets of the bridge this object correlates to.
   */
  XChainBridge: XChainBridge

  /**
   * An integer that determines the order that accounts created through
   * cross-chain transfers must be performed. Smaller numbers must execute
   * before larger numbers.
   */
  XChainAccountCreateCount: number

  /**
   * Attestations collected from the witness servers. This includes the parameters
   * needed to recreate the message that was signed, including the amount, destination,
   * signature reward amount, and reward account for that signature. With the
   * exception of the reward account, all signatures must sign the message created with
   * common parameters.
   */
  XChainCreateAccountAttestations: Array<{
    // TODO: add docs
    XChainCreateAccountProofSig: {
      Amount: string

      AttestationRewardAccount: string

      AttestationSignerAccount: string

      Destination: string

      PublicKey: string

      WasLockingChainSend: 0 | 1
    }
  }>

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
}
