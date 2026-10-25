import { BallotOption } from '../transactions/ballotCastVote'
import { BallotResult } from '../transactions/ballotFinalize'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * Enum for Ballot ledger entry flags.
 *
 * @category Ledger Entry Flags
 */
export enum BallotFlags {
  /** The ballot's results have been published by BallotFinalize. */
  lsfBallotFinalized = 0x00000001,
  /** Every cast must carry a vote vector under the voter's own key. */
  lsfVoterRecoverable = 0x00000002,
}

/**
 * The Ballot object type represents a confidential ballot whose per-option
 * tally is kept as ElGamal ciphertexts under the tally key.
 *
 * @category Ledger Entries
 */
export default interface Ballot extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Ballot'
  /** A bit-map of boolean flags; see {@link BallotFlags}. */
  Flags: number
  /** The account that created the ballot. */
  Owner: string
  /** The sequence (or ticket) number of the BallotCreate transaction. */
  Sequence: number
  /** The MPT issuance whose holders vote (token mode). */
  MPTokenIssuanceID?: string
  /** The PermissionedDomain whose credential holders vote (credential mode). */
  DomainID?: string
  /** Hash of the off-ledger ballot document. */
  Digest: string
  /** A hex-encoded URI of the ballot document. */
  URI?: string
  /** The number of options on the ballot. */
  OptionCount: number
  /** The tally authority's compressed ElGamal public key. */
  TallyPublicKey: string
  /** The auditor's compressed ElGamal public key, if the ballot has one. */
  AuditorEncryptionKey?: string
  /** The running encrypted tally, one ElGamal ciphertext per option. */
  EncryptedTally: BallotOption[]
  /** The time, in seconds since the Ripple Epoch, voting opens. */
  OpenTime: number
  /** The time, in seconds since the Ripple Epoch, voting closes. */
  CloseTime: number
  /** The number of votes cast. Absent when zero. */
  VoteCount?: number
  /** The plaintext result of each option, present after BallotFinalize. */
  Results?: BallotResult[]
  /**
   * A hint indicating which page of the owner's directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
}
