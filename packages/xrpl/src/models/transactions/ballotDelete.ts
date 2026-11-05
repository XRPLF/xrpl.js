import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  validateFlagsMask,
  validateNonZeroField,
  validateRequiredField,
} from './common'

/**
 * The BallotDelete transaction deletes a Ballot (by its owner) or the
 * submitter's own BallotVote on that Ballot (by the voter).
 *
 * @category Transaction Models
 */
export interface BallotDelete extends BaseTransaction {
  TransactionType: 'BallotDelete'
  /** The ledger index of the Ballot. */
  BallotID: string
}

/**
 * Verify the form and type of a BallotDelete at runtime.
 *
 * @param tx - A BallotDelete Transaction.
 * @throws When the BallotDelete is malformed.
 */
export function validateBallotDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'BallotID', isLedgerEntryId)
  validateNonZeroField(tx, 'BallotID')
}
