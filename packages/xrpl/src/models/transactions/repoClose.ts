import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  validateFlagsMask,
  validateRequiredField,
} from './common'

/**
 * The RepoClose transaction repurchases the collateral of an active repo:
 * the seller pays the PurchasePrice plus interest to the Counterparty, no
 * later than MaturityDate plus GracePeriod, and the collateral is released.
 *
 * @category Transaction Models
 */
export interface RepoClose extends BaseTransaction {
  TransactionType: 'RepoClose'

  /** The ID of the active Repo ledger entry to close. */
  RepoID: string
}

/**
 * Verify the form and type of a {@link RepoClose} at runtime.
 *
 * @param tx - A {@link RepoClose} Transaction.
 * @throws When the {@link RepoClose} is malformed.
 */
export function validateRepoClose(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'RepoID', isLedgerEntryId)
}
