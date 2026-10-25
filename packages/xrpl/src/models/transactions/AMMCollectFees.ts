import { ValidationError } from '../../errors'
import { Currency } from '../common'

import {
  BaseTransaction,
  isCurrency,
  isLedgerEntryId,
  isNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * (AMMCurves) Collect the trading fees owed to a liquidity provider by a
 * concentrated liquidity position or by a bin of a binned AMM.
 *
 * @category Transaction Models
 */
export interface AMMCollectFees extends BaseTransaction {
  TransactionType: 'AMMCollectFees'

  /**
   * The definition for one of the assets in the AMM's pool.
   */
  Asset: Currency

  /**
   * The definition for the other asset in the AMM's pool.
   */
  Asset2: Currency

  /**
   * The curve type of the AMM, one of {@link AMMCurveType}.
   * Defaults to the constant-product curve (0).
   */
  CurveType?: number

  /**
   * The ledger entry ID of the concentrated liquidity position (an AMMPosition) to collect fees from.
   * Exactly one of `PositionID` or `BinID` is required.
   */
  PositionID?: string

  /**
   * The bin of a binned AMM to collect fees from.
   * Exactly one of `PositionID` or `BinID` is required.
   */
  BinID?: number
}

/**
 * Verify the form and type of an {@link AMMCollectFees} at runtime.
 *
 * @param tx - An {@link AMMCollectFees} Transaction.
 * @throws When the {@link AMMCollectFees} is malformed.
 */
export function validateAMMCollectFees(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Asset', isCurrency)
  validateRequiredField(tx, 'Asset2', isCurrency)
  validateOptionalField(tx, 'CurveType', isNumber)
  validateOptionalField(tx, 'PositionID', isLedgerEntryId)
  validateOptionalField(tx, 'BinID', isNumber)

  if ((tx.PositionID === undefined) === (tx.BinID === undefined)) {
    throw new ValidationError(
      'AMMCollectFees: exactly one of PositionID or BinID is required',
    )
  }
}
