import { Amount, MPTAmount } from '../common'
import { XRPLNumber } from '../transactions/common'

import { BaseLedgerEntry } from './BaseLedgerEntry'

/**
 * (AMMCurves) The AMMPosition object type describes one liquidity provider's
 * position in a concentrated liquidity AMM: liquidity provided over the tick
 * range from `TickLower` to `TickUpper`.
 *
 * @category Ledger Entries
 */
export default interface AMMPosition extends BaseLedgerEntry {
  LedgerEntryType: 'AMMPosition'
  /**
   * The account that owns the position.
   */
  Account: string
  /**
   * The ledger entry ID of the AMM the position belongs to.
   */
  AMMID: string
  /**
   * The lower tick of the position's range.
   */
  TickLower: number
  /**
   * The upper tick of the position's range.
   */
  TickUpper: number
  /**
   * The liquidity of the position, as a hex-encoded 64-bit unsigned integer.
   */
  PositionLiquidity: string
  /**
   * The fee growth per unit of liquidity inside the range for the first asset,
   * as of the last time the position's fees were settled.
   */
  FeeGrowthInsideLast0: XRPLNumber
  /**
   * The fee growth per unit of liquidity inside the range for the second asset,
   * as of the last time the position's fees were settled.
   */
  FeeGrowthInsideLast1: XRPLNumber
  /**
   * The fees in the first asset owed to the position and not yet collected.
   */
  TokensOwed0?: Amount | MPTAmount
  /**
   * The fees in the second asset owed to the position and not yet collected.
   */
  TokensOwed1?: Amount | MPTAmount
  /**
   * A hint indicating which page of the owner directory links to this object,
   * in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /**
   * A bit-map of boolean flags. No flags are defined for the AMMPosition
   * object type, so this value is always 0.
   */
  Flags: 0
}
