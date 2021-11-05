import BaseLedgerEntry from './BaseLedgerEntry'

/**
 * The LedgerHashes objects exist to make it possible to look up a previous
 * ledger's hash with only the current ledger version and at most one lookup of
 * a previous ledger version.
 *
 * @category Ledger Entries
 */
export default interface LedgerHashes extends BaseLedgerEntry {
  LedgerEntryType: 'LedgerHashes'
  /** The Ledger Index of the last entry in this object's Hashes array. */
  LastLedgerSequence?: number
  /**
   * An array of up to 256 ledger hashes. The contents depend on which sub-type
   * of LedgerHashes object this is.
   */
  Hashes: string[]
  /**
   * A bit-map of boolean flags for this object. No flags are defined for this
   * type.
   */
  Flags: number
}
