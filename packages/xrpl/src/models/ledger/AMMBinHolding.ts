import { XRPLNumber } from '../transactions/common'

import { BaseLedgerEntry } from './BaseLedgerEntry'

/**
 * (AMMCurves) The AMMBinHolding object type records one liquidity provider's
 * fee snapshot for one bin of a binned AMM. The provider's shares are its
 * balance of the bin's MPT; fees owed are
 * `min(Shares, MPT balance) * (bin fee growth - snapshot)`.
 *
 * @category Ledger Entries
 */
export default interface AMMBinHolding extends BaseLedgerEntry {
  LedgerEntryType: 'AMMBinHolding'
  /**
   * The liquidity provider the snapshot belongs to.
   */
  Account: string
  /**
   * The ledger entry ID of the AMM the bin belongs to.
   */
  AMMID: string
  /**
   * The ID of the bin.
   */
  BinID: number
  /**
   * The bin's fee growth per share for the first asset when the snapshot was taken.
   */
  FeeGrowthInsideLast0: XRPLNumber
  /**
   * The bin's fee growth per share for the second asset when the snapshot was taken.
   */
  FeeGrowthInsideLast1: XRPLNumber
  /**
   * The shares the provider held when the snapshot was taken,
   * as a hex-encoded 64-bit unsigned integer.
   */
  Shares?: string
  /**
   * A hint indicating which page of the owner directory links to this object,
   * in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /**
   * A bit-map of boolean flags. No flags are defined for the AMMBinHolding
   * object type, so this value is always 0.
   */
  Flags: 0
}
