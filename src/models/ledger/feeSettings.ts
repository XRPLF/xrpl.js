import BaseLedgerEntry from './baseLedgerEntry'

/**
 * The FeeSettings object type contains the current base transaction cost and
 * reserve amounts as determined by fee voting.
 *
 * @category Ledger Entries
 */
export default interface FeeSettings extends BaseLedgerEntry {
  LedgerEntryType: 'FeeSettings'
  /**
   * The transaction cost of the "reference transaction" in drops of XRP as
   * hexadecimal.
   */
  BaseFee: string
  /** The BaseFee translated into "fee units". */
  ReferenceFeeUnits: number
  /** The base reserve for an account in the XRP Ledger, as drops of XRP. */
  ReserveBase: number
  /** The incremental owner reserve for owning objects, as drops of XRP. */
  ReserveIncrement: number
  /**
   * A bit-map of boolean flags for this object. No flags are defined for this
   * type.
   */
  Flags: number
}
