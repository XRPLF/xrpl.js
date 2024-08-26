import { PriceData } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The Oracle object type describes a single Price Oracle instance.
 *
 * @category Ledger Entries
 */
export default interface Oracle extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Oracle'

  /**
   * The time the data was last updated, represented as a unix timestamp in seconds.
   */
  LastUpdateTime: number

  /**
   * The XRPL account with update and delete privileges for the oracle.
   */
  Owner: string

  /**
   * Describes the type of asset, such as "currency", "commodity", or "index".
   */
  AssetClass: string

  /**
   * The oracle provider, such as Chainlink, Band, or DIA.
   */
  Provider: string

  /**
   * An array of up to 10 PriceData objects.
   */
  PriceDataSeries: PriceData[]

  /**
   * A bit-map of boolean flags. No flags are defined for the Oracle object
   * type, so this value is always 0.
   */
  Flags: 0
}
