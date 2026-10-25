import { Amount, MPTAmount } from '../common'
import { XRPLNumber } from '../transactions/common'

import { BaseLedgerEntry } from './BaseLedgerEntry'

/**
 * (AMMCurves) The AMMBin object type describes one bin of a binned AMM. A bin
 * holds reserves of both assets at a fixed price. Its shares are the tokens of
 * the MPT issuance `MPTokenIssuanceID`.
 *
 * @category Ledger Entries
 */
export default interface AMMBin extends BaseLedgerEntry {
  LedgerEntryType: 'AMMBin'
  /**
   * The ledger entry ID of the AMM the bin belongs to.
   */
  AMMID: string
  /**
   * The ID of the bin. The bin's price is `(1 + BinStep / 10000) ^ BinID`.
   */
  BinID: number
  /**
   * The bin's reserve of the first asset.
   */
  Reserve0: Amount | MPTAmount
  /**
   * The bin's reserve of the second asset.
   */
  Reserve1: Amount | MPTAmount
  /**
   * The fee growth per share for the first asset.
   */
  FeeGrowthBin0: XRPLNumber
  /**
   * The fee growth per share for the second asset.
   */
  FeeGrowthBin1: XRPLNumber
  /**
   * The trading fees in the first asset the bin's holders have not collected yet.
   * Fees are not part of the reserves.
   */
  TokensOwed0?: Amount | MPTAmount
  /**
   * The trading fees in the second asset the bin's holders have not collected yet.
   * Fees are not part of the reserves.
   */
  TokensOwed1?: Amount | MPTAmount
  /**
   * The number of the bin's shares in existence, as a base-10 string.
   */
  OutstandingAmount: string
  /**
   * The ID of the MPT issuance whose tokens are the bin's shares.
   */
  MPTokenIssuanceID?: string
  /**
   * A hint indicating which page of the AMM account's owner directory links to
   * this object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /**
   * A bit-map of boolean flags. No flags are defined for the AMMBin object
   * type, so this value is always 0.
   */
  Flags: 0
}
