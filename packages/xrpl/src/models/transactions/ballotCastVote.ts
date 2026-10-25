import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isArray,
  isCompressedECPoint,
  isElGamalCiphertext,
  isHexWithByteLength,
  isLedgerEntryId,
  isNonEmptyHexBlob,
  isRecord,
  isString,
  validateBaseTransaction,
  validateCredentialsList,
  validateFlagsMask,
  validateOptionalField,
  validateRequiredField,
  CONFIDENTIAL_BLINDING_FACTOR_BYTES,
  CONFIDENTIAL_SEND_SIGMA_PROOF_BYTES,
  MAX_AUTHORIZED_CREDENTIALS,
} from './common'

const MAX_BALLOT_OPTIONS = 8

/**
 * One entry of a ballot ciphertext vector: the ElGamal ciphertext of one
 * option's vote and, in a cast's primary vector, its Pedersen commitment and
 * linkage proof.
 */
export interface BallotOption {
  BallotOption: {
    /** ElGamal ciphertext of the option's vote (66 bytes). */
    EncryptedVote: string
    /**
     * Pedersen commitment to the option's vote (33 bytes). Required in a
     * cast's EncryptedVotes and absent from its mirror vectors.
     */
    AmountCommitment?: string
    /**
     * Proof linking the ciphertexts to the commitment (192 bytes). Required
     * in a cast's EncryptedVotes.
     */
    ZKProof?: string
  }
}

/**
 * The BallotCastVote transaction casts an encrypted vote on a Ballot: one
 * ciphertext per option under the tally key, with optional mirror vectors
 * under the auditor's and the voter's own keys.
 *
 * @category Transaction Models
 */
export interface BallotCastVote extends BaseTransaction {
  TransactionType: 'BallotCastVote'
  /** The ledger index of the Ballot being voted on. */
  BallotID: string
  /** The vote vector under the tally key, one entry per option. */
  EncryptedVotes: BallotOption[]
  /** The vote vector under the ballot's auditor key. */
  AuditorEncryptedVotes?: BallotOption[]
  /** The voter's compressed ElGamal public key (33 bytes). */
  VoterPublicKey?: string
  /** The vote vector under the voter's own key, for self-recovery. */
  VoterEncryptedVotes?: BallotOption[]
  /** The aggregated range proof over the per-option commitments. */
  ZKProof: string
  /**
   * The aggregate ElGamal randomness (32 bytes) showing the vote vector sums
   * to the voter's weight.
   */
  BlindingFactor: string
  /** Credentials the voter presents in a credential-mode ballot. */
  CredentialIDs?: string[]
}

/**
 * Whether an entry is a BallotOption of the primary vote vector: a valid
 * ciphertext, a commitment and a 192-byte linkage proof.
 *
 * @param entry - The array entry to check.
 * @returns Whether the entry is valid.
 */
function isCastOption(entry: unknown): boolean {
  if (!isRecord(entry) || !isRecord(entry.BallotOption)) {
    return false
  }
  const option = entry.BallotOption
  return (
    isElGamalCiphertext(option.EncryptedVote) &&
    isCompressedECPoint(option.AmountCommitment) &&
    isHexWithByteLength(CONFIDENTIAL_SEND_SIGMA_PROOF_BYTES)(option.ZKProof)
  )
}

/**
 * Whether an entry is a BallotOption of a mirror vector: a valid ciphertext
 * and no commitment.
 *
 * @param entry - The array entry to check.
 * @returns Whether the entry is valid.
 */
function isMirrorOption(entry: unknown): boolean {
  if (!isRecord(entry) || !isRecord(entry.BallotOption)) {
    return false
  }
  const option = entry.BallotOption
  return (
    isElGamalCiphertext(option.EncryptedVote) &&
    option.AmountCommitment === undefined &&
    (option.ZKProof === undefined || isString(option.ZKProof))
  )
}

/**
 * The primary vote vector has 1 to 8 valid cast entries.
 *
 * @param tx - The transaction to validate.
 * @returns The number of entries in EncryptedVotes.
 * @throws ValidationError if EncryptedVotes is malformed.
 */
function validateEncryptedVotes(tx: Record<string, unknown>): number {
  validateRequiredField(tx, 'EncryptedVotes', isArray)
  if (
    tx.EncryptedVotes.length === 0 ||
    tx.EncryptedVotes.length > MAX_BALLOT_OPTIONS
  ) {
    throw new ValidationError(
      `BallotCastVote: EncryptedVotes must have between 1 and ${MAX_BALLOT_OPTIONS} entries`,
    )
  }
  if (!tx.EncryptedVotes.every(isCastOption)) {
    throw new ValidationError('BallotCastVote: invalid field EncryptedVotes')
  }
  return tx.EncryptedVotes.length
}

/**
 * A mirror vector, when set, has one valid mirror entry per primary entry.
 *
 * @param tx - The transaction to validate.
 * @param field - The mirror vector's field name.
 * @param optionCount - The number of entries in EncryptedVotes.
 * @throws ValidationError if the mirror vector is malformed.
 */
function validateMirrorVotes(
  tx: Record<string, unknown>,
  field: 'AuditorEncryptedVotes' | 'VoterEncryptedVotes',
  optionCount: number,
): void {
  const votes = tx[field]
  if (votes === undefined) {
    return
  }
  if (
    !isArray(votes) ||
    votes.length !== optionCount ||
    !votes.every(isMirrorOption)
  ) {
    throw new ValidationError(`BallotCastVote: invalid field ${field}`)
  }
}

/**
 * VoterPublicKey and VoterEncryptedVotes are set together, and the key is a
 * compressed EC point.
 *
 * @param tx - The transaction to validate.
 * @throws ValidationError if only one is set or the key is malformed.
 */
function validateVoterKey(tx: Record<string, unknown>): void {
  if ((tx.VoterPublicKey == null) !== (tx.VoterEncryptedVotes == null)) {
    throw new ValidationError(
      'BallotCastVote: VoterPublicKey and VoterEncryptedVotes must be set together',
    )
  }
  validateOptionalField(tx, 'VoterPublicKey', isCompressedECPoint)
}

/**
 * Verify the form and type of a BallotCastVote at runtime.
 *
 * @param tx - A BallotCastVote Transaction.
 * @throws When the BallotCastVote is malformed.
 */
export function validateBallotCastVote(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'BallotID', isLedgerEntryId)
  const optionCount = validateEncryptedVotes(tx)
  validateMirrorVotes(tx, 'AuditorEncryptedVotes', optionCount)
  validateVoterKey(tx)
  validateMirrorVotes(tx, 'VoterEncryptedVotes', optionCount)
  validateRequiredField(tx, 'ZKProof', isNonEmptyHexBlob)
  validateRequiredField(
    tx,
    'BlindingFactor',
    isHexWithByteLength(CONFIDENTIAL_BLINDING_FACTOR_BYTES),
  )
  validateCredentialsList(
    tx.CredentialIDs,
    tx.TransactionType,
    true,
    MAX_AUTHORIZED_CREDENTIALS,
  )
}
