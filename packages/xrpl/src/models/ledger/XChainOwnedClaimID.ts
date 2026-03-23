import { Amount, XChainBridge } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * An XChainOwnedClaimID object represents one cross-chain transfer of value
 * and includes information of the account on the source chain that locks or
 * burns the funds on the source chain.
 *
 * @category Ledger Entries
 */
export default interface XChainOwnedClaimID
  extends BaseLedgerEntry,
    HasPreviousTxnID {
  LedgerEntryType: 'XChainOwnedClaimID'

  /** The account that checked out this unique claim ID value. */
  Account: string

  /**
   * The door accounts and assets of the bridge this object correlates to.
   */
  XChainBridge: XChainBridge

  /**
   * The unique sequence number for a cross-chain transfer.
   */
  XChainClaimID: string

  /**
   * The account that must send the corresponding {@link XChainCommit} on the
   * source chain. The destination may be specified in the {@link XChainCommit}
   * transaction, which means that if the OtherChainSource isn't specified,
   * another account can try to specify a different destination and steal the
   * funds. This also allows tracking only a single set of signatures, since we
   * know which account will send the {@link XChainCommit} transaction.
   */
  OtherChainSource: string

  /**
   * Attestations collected from the witness servers. This includes the parameters
   * needed to recreate the message that was signed, including the amount, which
   * chain (locking or issuing), optional destination, and reward account for that
   * signature.
   */
  XChainClaimAttestations: Array<{
    // TODO: add docs
    XChainClaimProofSig: {
      Amount: Amount

      AttestationRewardAccount: string

      AttestationSignerAccount: string

      Destination?: string

      PublicKey: string

      WasLockingChainSend: 0 | 1
    }
  }>

  /**
   * The total amount to pay the witness servers for their signatures. It must be at
   * least the value of the SignatureReward in the {@link Bridge} ledger object.
   */
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
}
