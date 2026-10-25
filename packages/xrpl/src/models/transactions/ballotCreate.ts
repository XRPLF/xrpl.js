import { ValidationError } from '../../errors'
import { isHex } from '../utils'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isCompressedECPoint,
  isDomainID,
  isHexWithByteLength,
  isMPTokenIssuanceID,
  isNumber,
  isString,
  validateBaseTransaction,
  validateFlagsMask,
  validateOptionalField,
  validateRequiredField,
  CONFIDENTIAL_CONVERT_PROOF_BYTES,
} from './common'

const MIN_BALLOT_OPTIONS = 2
const MAX_BALLOT_OPTIONS = 8
const MAX_BALLOT_URI_BYTES = 256
const DIGEST_BYTES = 32
const HEX_CHARS_PER_BYTE = 2

/**
 * Enum representing values of {@link BallotCreate} transaction flags.
 *
 * @category Transaction Flags
 */
export enum BallotCreateFlags {
  /** Every cast must carry a vote vector the voter can decrypt themselves. */
  tfVoterRecoverable = 0x00000002,
}

/**
 * Map of flags to boolean values representing {@link BallotCreate}
 * transaction flags.
 *
 * @category Transaction Flags
 */
export interface BallotCreateFlagsInterface extends GlobalFlagsInterface {
  tfVoterRecoverable?: boolean
}

/**
 * The BallotCreate transaction creates a confidential Ballot whose per-option
 * tally is kept as ElGamal ciphertexts under a tally key. Eligibility comes
 * from exactly one of an MPT issuance (token mode, weighted by balance) or a
 * PermissionedDomain (credential mode, one vote per credential holder).
 *
 * @category Transaction Models
 */
export interface BallotCreate extends BaseTransaction {
  TransactionType: 'BallotCreate'
  Flags?: number | BallotCreateFlagsInterface
  /** The MPT issuance whose holders vote (token mode). */
  MPTokenIssuanceID?: string
  /** The PermissionedDomain whose credential holders vote (credential mode). */
  DomainID?: string
  /** Hash of the off-ledger ballot document. */
  Digest: string
  /** A hex-encoded URI of the ballot document, 1 to 256 bytes. */
  URI?: string
  /** The number of options on the ballot, 2 to 8. */
  OptionCount: number
  /** The tally authority's compressed ElGamal public key (33 bytes). */
  TallyPublicKey: string
  /** An optional auditor's compressed ElGamal public key (33 bytes). */
  AuditorEncryptionKey?: string
  /** The time, in seconds since the Ripple Epoch, voting opens. */
  OpenTime: number
  /** The time, in seconds since the Ripple Epoch, voting closes. */
  CloseTime: number
  /** The 64-byte Schnorr proof of possession of the tally key. */
  ZKProof: string
}

/**
 * Exactly one eligibility source, MPTokenIssuanceID or DomainID, is set.
 *
 * @param tx - The transaction to validate.
 * @throws ValidationError if neither or both are set.
 */
function validateEligibilitySource(tx: Record<string, unknown>): void {
  if ((tx.MPTokenIssuanceID == null) === (tx.DomainID == null)) {
    throw new ValidationError(
      'BallotCreate: exactly one of MPTokenIssuanceID and DomainID must be set',
    )
  }
}

/**
 * The URI, when set, is hex of 1 to 256 bytes.
 *
 * @param tx - The transaction to validate.
 * @throws ValidationError if the URI is malformed.
 */
function validateURI(tx: Record<string, unknown>): void {
  validateOptionalField(tx, 'URI', isString)
  if (tx.URI === undefined) {
    return
  }
  const byteLength = tx.URI.length / HEX_CHARS_PER_BYTE
  if (byteLength === 0 || byteLength > MAX_BALLOT_URI_BYTES) {
    throw new ValidationError(
      `BallotCreate: URI must be between 1 and ${MAX_BALLOT_URI_BYTES} bytes`,
    )
  }
  if (!isHex(tx.URI) || tx.URI.length % HEX_CHARS_PER_BYTE !== 0) {
    throw new ValidationError('BallotCreate: invalid field URI')
  }
}

/**
 * The option count is within bounds and the voting window is non-empty.
 *
 * @param tx - The transaction to validate.
 * @throws ValidationError if OptionCount, OpenTime or CloseTime is malformed.
 */
function validateOptionsAndWindow(tx: Record<string, unknown>): void {
  validateRequiredField(tx, 'OptionCount', isNumber)
  validateRequiredField(tx, 'OpenTime', isNumber)
  validateRequiredField(tx, 'CloseTime', isNumber)
  if (
    tx.OptionCount < MIN_BALLOT_OPTIONS ||
    tx.OptionCount > MAX_BALLOT_OPTIONS
  ) {
    throw new ValidationError(
      `BallotCreate: OptionCount must be between ${MIN_BALLOT_OPTIONS} and ${MAX_BALLOT_OPTIONS}`,
    )
  }
  if (tx.OpenTime >= tx.CloseTime) {
    throw new ValidationError('BallotCreate: OpenTime must be before CloseTime')
  }
}

/**
 * Verify the form and type of a BallotCreate at runtime.
 *
 * @param tx - A BallotCreate Transaction.
 * @throws When the BallotCreate is malformed.
 */
export function validateBallotCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx, BallotCreateFlags)
  validateOptionalField(tx, 'MPTokenIssuanceID', isMPTokenIssuanceID)
  validateOptionalField(tx, 'DomainID', isDomainID)
  validateEligibilitySource(tx)
  validateRequiredField(tx, 'Digest', isHexWithByteLength(DIGEST_BYTES))
  validateOptionsAndWindow(tx)
  validateRequiredField(tx, 'TallyPublicKey', isCompressedECPoint)
  validateRequiredField(
    tx,
    'ZKProof',
    isHexWithByteLength(CONFIDENTIAL_CONVERT_PROOF_BYTES),
  )
  validateOptionalField(tx, 'AuditorEncryptionKey', isCompressedECPoint)
  validateURI(tx)
}
