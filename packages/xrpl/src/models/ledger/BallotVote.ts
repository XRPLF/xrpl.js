import { BallotOption } from '../transactions/ballotCastVote'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The BallotVote object type records one voter's cast on a Ballot.
 *
 * @category Ledger Entries
 */
export default interface BallotVote extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'BallotVote'
  /** A bit-map of boolean flags. No flags are defined for BallotVote. */
  Flags: number
  /** The voter. */
  Account: string
  /** The ledger index of the Ballot voted on. */
  BallotID: string
  /** The voter's weight at the time of the cast, as a UInt64 hex string. */
  BallotWeight: string
  /** The vote vector under the tally key. */
  EncryptedVotes: BallotOption[]
  /** The vote vector under the auditor key, when the ballot has one. */
  AuditorEncryptedVotes?: BallotOption[]
  /** The voter's compressed ElGamal public key, when the ballot is voter-recoverable. */
  VoterPublicKey?: string
  /** The vote vector under the voter's own key, when the ballot is voter-recoverable. */
  VoterEncryptedVotes?: BallotOption[]
  /**
   * A hint indicating which page of the voter's directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
}
