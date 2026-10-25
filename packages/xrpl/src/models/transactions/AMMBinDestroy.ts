import { ValidationError } from '../../errors'
import { Currency } from '../common'

import { AMM_MAX_BIN_ID, AMM_MIN_BIN_ID, isAMMBinIDInRange } from './AMMCreate'
import {
  BaseTransaction,
  isCurrency,
  isNumber,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * (AMMCurves) Delete an empty bin of a binned AMM, together with the MPT issuance
 * whose tokens are the bin's shares.
 *
 * @category Transaction Models
 */
export interface AMMBinDestroy extends BaseTransaction {
  TransactionType: 'AMMBinDestroy'

  /**
   * The definition for one of the assets in the AMM's pool.
   */
  Asset: Currency

  /**
   * The definition for the other asset in the AMM's pool.
   */
  Asset2: Currency

  /**
   * The bin to delete, from -221818 to 221818.
   */
  BinID: number
}

/**
 * Verify the form and type of an {@link AMMBinDestroy} at runtime.
 *
 * @param tx - An {@link AMMBinDestroy} Transaction.
 * @throws When the {@link AMMBinDestroy} is malformed.
 */
export function validateAMMBinDestroy(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Asset', isCurrency)
  validateRequiredField(tx, 'Asset2', isCurrency)
  validateRequiredField(tx, 'BinID', isNumber)

  if (!isAMMBinIDInRange(tx.BinID)) {
    throw new ValidationError(
      `AMMBinDestroy: BinID must be between ${AMM_MIN_BIN_ID} and ${AMM_MAX_BIN_ID}`,
    )
  }
}
