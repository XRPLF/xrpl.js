import { BaseLedgerEntry, HasOptionalPreviousTxnID } from './BaseLedgerEntry'

/**
 * The unique id for the Amendments object https://xrpl.org/amendments-object.html#amendments-id-format
 */
export const AMENDMENTS_ID =
  '7DB0788C020F02780A673DC74757F23823FA3014C1866E72CC4CD8B226CD6EF4'

export interface Majority {
  Majority: {
    /** The Amendment ID of the pending amendment. */
    Amendment: string
    /**
     * The `close_time` field of the ledger version where this amendment most
     * recently gained a majority.
     */
    CloseTime: number
  }
}

/**
 * The Amendments object type contains a list of Amendments that are currently
 * active.
 *
 * @category Ledger Entries
 */
export default interface Amendments
  extends BaseLedgerEntry,
    HasOptionalPreviousTxnID {
  LedgerEntryType: 'Amendments'
  /**
   * Array of 256-bit amendment IDs for all currently-enabled amendments. If
   * omitted, there are no enabled amendments.
   */
  Amendments?: string[]
  /**
   * Array of objects describing the status of amendments that have majority
   * support but are not yet enabled. If omitted, there are no pending
   * amendments with majority support.
   */
  Majorities?: Majority[]
  /**
   * A bit-map of boolean flags. No flags are defined for the Amendments object
   * type, so this value is always 0.
   */
  Flags: 0
}
