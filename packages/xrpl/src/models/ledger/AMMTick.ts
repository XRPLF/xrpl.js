import { XRPLNumber } from '../transactions/common'

import { BaseLedgerEntry } from './BaseLedgerEntry'

/**
 * (AMMCurves) The AMMTick object type describes an initialized tick of a
 * concentrated liquidity AMM: a tick that is the lower or upper bound of at
 * least one position.
 *
 * @category Ledger Entries
 */
export default interface AMMTick extends BaseLedgerEntry {
  LedgerEntryType: 'AMMTick'
  /**
   * The ledger entry ID of the AMM the tick belongs to.
   */
  AMMID: string
  /**
   * The index of the tick.
   */
  TickIndex: number
  /**
   * The net liquidity of the positions bounded by this tick: plus the liquidity of
   * each position whose lower tick it is, minus that of each position whose upper
   * tick it is. A hex-encoded 64-bit integer read as signed (two's complement).
   */
  LiquidityNet: string
  /**
   * The total liquidity of the positions that use this tick as a bound,
   * as a hex-encoded 64-bit unsigned integer.
   */
  LiquidityGross: string
  /**
   * The fee growth per unit of liquidity for the first asset recorded outside
   * this tick. Each time the price crosses the tick it becomes the AMM's
   * `FeeGrowthGlobal0` minus its previous value.
   */
  FeeGrowthOutside0: XRPLNumber
  /**
   * The fee growth per unit of liquidity for the second asset recorded outside
   * this tick. Each time the price crosses the tick it becomes the AMM's
   * `FeeGrowthGlobal1` minus its previous value.
   */
  FeeGrowthOutside1: XRPLNumber
  /**
   * Always 0: this object is not placed in any owner directory.
   */
  OwnerNode: string
  /**
   * A bit-map of boolean flags. No flags are defined for the AMMTick object
   * type, so this value is always 0.
   */
  Flags: 0
}
