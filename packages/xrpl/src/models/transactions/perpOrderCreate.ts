import { ValidationError } from '../../errors'
import { hasFlag } from '../utils'

import {
  Account,
  BaseTransaction,
  GlobalFlagsInterface,
  isAccount,
  isLedgerEntryId,
  isNumber,
  isXRPLNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
  XRPLNumber,
} from './common'

/**
 * Enum representing values of {@link PerpOrderCreate} transaction flags.
 *
 * @category Transaction Flags
 */
export enum PerpOrderCreateFlags {
  /** The order sells; without it the order buys. */
  tfPerpSell = 0x00010000,
  /** Drop any remainder after matching. */
  tfImmediateOrCancel = 0x00020000,
  /** Fail with tecKILLED if any size is left after matching. */
  tfFillOrKill = 0x00040000,
  /** The order may only reduce the position. */
  tfPerpReduceOnly = 0x00080000,
  /** Fail with tecKILLED if the order would cross. */
  tfPerpPostOnly = 0x00100000,
}

/**
 * Map of flags to boolean values representing {@link PerpOrderCreate}
 * transaction flags.
 *
 * @category Transaction Flags
 */
export interface PerpOrderCreateFlagsInterface extends GlobalFlagsInterface {
  tfPerpSell?: boolean
  tfImmediateOrCancel?: boolean
  tfFillOrKill?: boolean
  tfPerpReduceOnly?: boolean
  tfPerpPostOnly?: boolean
}

/**
 * The PerpOrderCreate transaction places an order in a perpetual futures
 * market for one of the submitter's margin accounts.
 *
 * @category Transaction Models
 */
export interface PerpOrderCreate extends BaseTransaction {
  TransactionType: 'PerpOrderCreate'

  /** The ID of the PerpMarket ledger entry to trade. */
  MarketID: string

  /**
   * The limit price, as a Number string: positive, a multiple of the
   * market's PriceTick, at most 16 significant digits.
   */
  LimitPrice: XRPLNumber

  /**
   * The size in base units, as a Number string: positive, a multiple of the
   * market's LotSize.
   */
  Size: XRPLNumber

  /** The Sequence of an own resting order to cancel first. */
  OfferSequence?: number

  /**
   * The time, in seconds since the Ripple Epoch, after which a resting order
   * is expired.
   */
  Expiration?: number

  /** The builder paid on each fill; present together with BuilderFee. */
  Builder?: Account

  /**
   * The builder fee rate, in 1/10 basis points, at most the exchange's
   * BuilderFeeMax; present together with Builder.
   */
  BuilderFee?: number

  Flags?: number | PerpOrderCreateFlagsInterface
}

/**
 * Verify the form and type of a {@link PerpOrderCreate} at runtime.
 *
 * @param tx - A {@link PerpOrderCreate} Transaction.
 * @throws When the {@link PerpOrderCreate} is malformed.
 */
export function validatePerpOrderCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'MarketID', isLedgerEntryId)
  validateRequiredField(tx, 'LimitPrice', isXRPLNumber)
  validateRequiredField(tx, 'Size', isXRPLNumber)
  validateOptionalField(tx, 'OfferSequence', isNumber)
  validateOptionalField(tx, 'Expiration', isNumber)
  validateOptionalField(tx, 'Builder', isAccount)
  validateOptionalField(tx, 'BuilderFee', isNumber)

  if ((tx.Builder === undefined) !== (tx.BuilderFee === undefined)) {
    throw new ValidationError(
      'PerpOrderCreate: Builder and BuilderFee must be present together',
    )
  }

  const timeInForce = [
    hasFlag(tx, PerpOrderCreateFlags.tfPerpPostOnly, 'tfPerpPostOnly'),
    hasFlag(
      tx,
      PerpOrderCreateFlags.tfImmediateOrCancel,
      'tfImmediateOrCancel',
    ),
    hasFlag(tx, PerpOrderCreateFlags.tfFillOrKill, 'tfFillOrKill'),
  ]
  if (timeInForce.filter(Boolean).length > 1) {
    throw new ValidationError(
      'PerpOrderCreate: at most one of tfPerpPostOnly, tfImmediateOrCancel and tfFillOrKill may be set',
    )
  }
}
