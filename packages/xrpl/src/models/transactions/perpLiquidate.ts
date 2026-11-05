import { ValidationError } from '../../errors'
import { hasFlag } from '../utils'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isLedgerEntryId,
  isXRPLNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
  XRPLNumber,
} from './common'

/**
 * Enum representing values of {@link PerpLiquidate} transaction flags.
 *
 * @category Transaction Flags
 */
export enum PerpLiquidateFlags {
  /** Close the position against the order book. */
  tfPerpLiquidateToBook = 0x00010000,
  /** The liquidator takes the position over at the index. */
  tfPerpLiquidateTakeover = 0x00020000,
}

/**
 * Map of flags to boolean values representing {@link PerpLiquidate}
 * transaction flags.
 *
 * @category Transaction Flags
 */
export interface PerpLiquidateFlagsInterface extends GlobalFlagsInterface {
  tfPerpLiquidateToBook?: boolean
  tfPerpLiquidateTakeover?: boolean
}

/**
 * The PerpLiquidate transaction reduces a position of an under-margined
 * margin account, in book mode or takeover mode. Any account with a margin
 * account on the same exchange may submit it; that margin account receives
 * the reward.
 *
 * @category Transaction Models
 */
export interface PerpLiquidate extends BaseTransaction {
  TransactionType: 'PerpLiquidate'

  /** The ID of the MarginAccount ledger entry to liquidate. */
  MarginAccountID: string

  /** The ID of the PerpMarket ledger entry of the position to reduce. */
  MarketID: string

  /** An upper bound on the size liquidated, as a Number string. */
  Size?: XRPLNumber

  Flags?: number | PerpLiquidateFlagsInterface
}

/**
 * Verify the form and type of a {@link PerpLiquidate} at runtime.
 *
 * @param tx - A {@link PerpLiquidate} Transaction.
 * @throws When the {@link PerpLiquidate} is malformed.
 */
export function validatePerpLiquidate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'MarginAccountID', isLedgerEntryId)
  validateRequiredField(tx, 'MarketID', isLedgerEntryId)
  validateOptionalField(tx, 'Size', isXRPLNumber)

  const toBook = hasFlag(
    tx,
    PerpLiquidateFlags.tfPerpLiquidateToBook,
    'tfPerpLiquidateToBook',
  )
  const takeover = hasFlag(
    tx,
    PerpLiquidateFlags.tfPerpLiquidateTakeover,
    'tfPerpLiquidateTakeover',
  )
  if (toBook === takeover) {
    throw new ValidationError(
      'PerpLiquidate: exactly one of tfPerpLiquidateToBook and tfPerpLiquidateTakeover must be set',
    )
  }
}
