import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * The PerpExchangeDelete transaction deletes an empty perpetual futures
 * exchange and its pseudo-account, and returns the exchange's collateral to
 * its owner.
 *
 * @category Transaction Models
 */
export interface PerpExchangeDelete extends BaseTransaction {
  TransactionType: 'PerpExchangeDelete'

  /** The ID of the PerpExchange ledger entry to delete. */
  ExchangeID: string
}

/**
 * Verify the form and type of a {@link PerpExchangeDelete} at runtime.
 *
 * @param tx - A {@link PerpExchangeDelete} Transaction.
 * @throws When the {@link PerpExchangeDelete} is malformed.
 */
export function validatePerpExchangeDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'ExchangeID', isLedgerEntryId)
}
