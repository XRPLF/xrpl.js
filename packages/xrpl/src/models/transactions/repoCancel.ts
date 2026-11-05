import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  validateFlagsMask,
  validateRequiredField,
} from './common'

/**
 * The RepoCancel transaction cancels a pending repo and returns the
 * collateral to the seller. The seller may cancel at any time; any account
 * may cancel once the offer has expired.
 *
 * @category Transaction Models
 */
export interface RepoCancel extends BaseTransaction {
  TransactionType: 'RepoCancel'

  /** The ID of the pending Repo ledger entry to cancel. */
  RepoID: string
}

/**
 * Verify the form and type of a {@link RepoCancel} at runtime.
 *
 * @param tx - A {@link RepoCancel} Transaction.
 * @throws When the {@link RepoCancel} is malformed.
 */
export function validateRepoCancel(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'RepoID', isLedgerEntryId)
}
