import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isArray,
  isLedgerEntryId,
  isNonEmptyHexBlob,
  isRecord,
  isString,
  validateBaseTransaction,
  validateFlagsMask,
  validateRequiredField,
  CONFIDENTIAL_CLAWBACK_PROOF_BYTES,
} from './common'

const MAX_BALLOT_OPTIONS = 8
const HEX_CHARS_PER_BYTE = 2
// A UInt64 without base-ten JSON rendering is 1 to 16 hex characters.
const UINT64_HEX_REGEX = /^[0-9A-Fa-f]{1,16}$/u

/**
 * One entry of a finalized ballot's plaintext result vector.
 */
export interface BallotResult {
  BallotResult: {
    /** The decrypted total weight for the option, as a UInt64 hex string. */
    BallotWeight: string
  }
}

/**
 * The BallotFinalize transaction publishes a Ballot's per-option results,
 * each with a proof that it is the correct decryption of the encrypted tally.
 *
 * @category Transaction Models
 */
export interface BallotFinalize extends BaseTransaction {
  TransactionType: 'BallotFinalize'
  /** The ledger index of the Ballot being finalized. */
  BallotID: string
  /** The plaintext result of each option, in option order. */
  Results: BallotResult[]
  /**
   * The concatenated decryption-correctness proofs, one 64-byte proof per
   * Results entry.
   */
  ZKProof: string
}

/**
 * Whether an entry is a BallotResult carrying a UInt64 BallotWeight.
 *
 * @param entry - The array entry to check.
 * @returns Whether the entry is valid.
 */
function isBallotResult(entry: unknown): boolean {
  return (
    isRecord(entry) &&
    isRecord(entry.BallotResult) &&
    isString(entry.BallotResult.BallotWeight) &&
    UINT64_HEX_REGEX.test(entry.BallotResult.BallotWeight)
  )
}

/**
 * Results has 1 to 8 valid entries.
 *
 * @param tx - The transaction to validate.
 * @returns The number of entries in Results.
 * @throws ValidationError if Results is malformed.
 */
function validateResults(tx: Record<string, unknown>): number {
  validateRequiredField(tx, 'Results', isArray)
  if (tx.Results.length === 0 || tx.Results.length > MAX_BALLOT_OPTIONS) {
    throw new ValidationError(
      `BallotFinalize: Results must have between 1 and ${MAX_BALLOT_OPTIONS} entries`,
    )
  }
  if (!tx.Results.every(isBallotResult)) {
    throw new ValidationError('BallotFinalize: invalid field Results')
  }
  return tx.Results.length
}

/**
 * Verify the form and type of a BallotFinalize at runtime.
 *
 * @param tx - A BallotFinalize Transaction.
 * @throws When the BallotFinalize is malformed.
 */
export function validateBallotFinalize(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'BallotID', isLedgerEntryId)
  const resultCount = validateResults(tx)
  validateRequiredField(tx, 'ZKProof', isNonEmptyHexBlob)
  const proofBytes = tx.ZKProof.length / HEX_CHARS_PER_BYTE
  if (proofBytes !== resultCount * CONFIDENTIAL_CLAWBACK_PROOF_BYTES) {
    throw new ValidationError(
      `BallotFinalize: ZKProof must hold one ${CONFIDENTIAL_CLAWBACK_PROOF_BYTES}-byte proof per Results entry`,
    )
  }
}
