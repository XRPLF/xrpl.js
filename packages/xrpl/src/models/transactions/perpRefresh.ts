import { ValidationError } from '../../errors'
import { hasFlag } from '../utils'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isLedgerEntryId,
  validateBaseTransaction,
  validateOptionalField,
} from './common'

/**
 * Enum representing values of {@link PerpRefresh} transaction flags.
 *
 * @category Transaction Flags
 */
export enum PerpRefreshFlags {
  /**
   * Settle a market that has been Stale for at least 86400 seconds
   * (rippled `kSettleStaleAfter`).
   */
  tfPerpSettleStale = 0x00010000,
}

/**
 * Map of flags to boolean values representing {@link PerpRefresh} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface PerpRefreshFlagsInterface extends GlobalFlagsInterface {
  tfPerpSettleStale?: boolean
}

/**
 * The PerpRefresh transaction refreshes a perpetual futures market's index
 * and funding, and settles a margin account. Any account may submit it.
 *
 * @category Transaction Models
 */
export interface PerpRefresh extends BaseTransaction {
  TransactionType: 'PerpRefresh'

  /** The ID of the PerpMarket ledger entry to refresh. */
  MarketID?: string

  /** The ID of the MarginAccount ledger entry to settle. */
  MarginAccountID?: string

  Flags?: number | PerpRefreshFlagsInterface
}

/**
 * Verify the form and type of a {@link PerpRefresh} at runtime.
 *
 * @param tx - A {@link PerpRefresh} Transaction.
 * @throws When the {@link PerpRefresh} is malformed.
 */
export function validatePerpRefresh(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateOptionalField(tx, 'MarketID', isLedgerEntryId)
  validateOptionalField(tx, 'MarginAccountID', isLedgerEntryId)

  if (tx.MarketID === undefined && tx.MarginAccountID === undefined) {
    throw new ValidationError(
      'PerpRefresh: at least one of MarketID and MarginAccountID must be present',
    )
  }

  if (
    hasFlag(tx, PerpRefreshFlags.tfPerpSettleStale, 'tfPerpSettleStale') &&
    tx.MarketID === undefined
  ) {
    throw new ValidationError(
      'PerpRefresh: tfPerpSettleStale requires MarketID',
    )
  }
}
