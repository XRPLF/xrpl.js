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
 * (AMMCurves) Create a bin in a binned AMM, together with the MPT issuance
 * whose tokens are the bin's shares. The fee is one owner reserve.
 *
 * @category Transaction Models
 */
export interface AMMBinCreate extends BaseTransaction {
  TransactionType: 'AMMBinCreate'

  /**
   * The definition for one of the assets in the AMM's pool.
   */
  Asset: Currency

  /**
   * The definition for the other asset in the AMM's pool.
   */
  Asset2: Currency

  /**
   * The bin to create, from -221818 to 221818.
   */
  BinID: number
}

/**
 * Verify the form and type of an {@link AMMBinCreate} at runtime.
 *
 * @param tx - An {@link AMMBinCreate} Transaction.
 * @throws When the {@link AMMBinCreate} is malformed.
 */
export function validateAMMBinCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Asset', isCurrency)
  validateRequiredField(tx, 'Asset2', isCurrency)
  validateRequiredField(tx, 'BinID', isNumber)

  if (!isAMMBinIDInRange(tx.BinID)) {
    throw new ValidationError(
      `AMMBinCreate: BinID must be between ${AMM_MIN_BIN_ID} and ${AMM_MAX_BIN_ID}`,
    )
  }
}
