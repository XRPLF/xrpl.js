import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  validateFlagsMask,
  validateRequiredField,
} from './common'

/**
 * The RepoDefault transaction closes out an active repo the seller did not
 * repurchase by MaturityDate plus GracePeriod: the Counterparty keeps the
 * collateral. Any account may submit it.
 *
 * @category Transaction Models
 */
export interface RepoDefault extends BaseTransaction {
  TransactionType: 'RepoDefault'

  /** The ID of the defaulted Repo ledger entry. */
  RepoID: string
}

/**
 * Verify the form and type of a {@link RepoDefault} at runtime.
 *
 * @param tx - A {@link RepoDefault} Transaction.
 * @throws When the {@link RepoDefault} is malformed.
 */
export function validateRepoDefault(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'RepoID', isLedgerEntryId)
}
