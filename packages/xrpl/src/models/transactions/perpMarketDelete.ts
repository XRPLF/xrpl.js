import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * The PerpMarketDelete transaction deletes a perpetual futures market that is
 * settled or never held a position, and has no open interest and no resting
 * orders.
 *
 * @category Transaction Models
 */
export interface PerpMarketDelete extends BaseTransaction {
  TransactionType: 'PerpMarketDelete'

  /** The ID of the PerpMarket ledger entry to delete. */
  MarketID: string
}

/**
 * Verify the form and type of a {@link PerpMarketDelete} at runtime.
 *
 * @param tx - A {@link PerpMarketDelete} Transaction.
 * @throws When the {@link PerpMarketDelete} is malformed.
 */
export function validatePerpMarketDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'MarketID', isLedgerEntryId)
}
