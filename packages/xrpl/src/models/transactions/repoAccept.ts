import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  validateFlagsMask,
  validateRequiredField,
} from './common'

/**
 * The RepoAccept transaction accepts a pending repo before its Expiration:
 * the Counterparty pays the PurchasePrice to the seller and the repo becomes
 * active.
 *
 * @category Transaction Models
 */
export interface RepoAccept extends BaseTransaction {
  TransactionType: 'RepoAccept'

  /** The ID of the pending Repo ledger entry to accept. */
  RepoID: string
}

/**
 * Verify the form and type of a {@link RepoAccept} at runtime.
 *
 * @param tx - A {@link RepoAccept} Transaction.
 * @throws When the {@link RepoAccept} is malformed.
 */
export function validateRepoAccept(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'RepoID', isLedgerEntryId)
}
