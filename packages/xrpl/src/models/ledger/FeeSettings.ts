import { BaseLedgerEntry, HasOptionalPreviousTxnID } from './BaseLedgerEntry'

/**
 * The unique id for the FeeSettings object https://xrpl.org/feesettings.html#feesettings-id-format
 */
export const FEE_SETTINGS_ID =
  '4BC50C9B0D8515D3EAAE1E74B29A95804346C491EE1A95BF25E4AAB854A6A651'

export interface FeeSettingsPreAmendmentFields {
  /** The transaction cost of the "reference transaction" in drops of XRP as hexadecimal. */
  BaseFee: string
  /** The BaseFee translated into "fee units". */
  ReferenceFeeUnits: number
  /** The base reserve for an account in the XRP Ledger, as drops of XRP. */
  ReserveBase: number
  /** The incremental owner reserve for owning objects, as drops of XRP. */
  ReserveIncrement: number
}

export interface FeeSettingsPostAmendmentFields {
  /** The transaction cost of the "reference transaction" in drops of XRP as hexadecimal. */
  BaseFeeDrops: string
  /** The base reserve for an account in the XRP Ledger, as drops of XRP. */
  ReserveBaseDrops: string
  /** The incremental owner reserve for owning objects, as drops of XRP. */
  ReserveIncrementDrops: string
}

export interface FeeSettingsBase
  extends BaseLedgerEntry,
    HasOptionalPreviousTxnID {
  LedgerEntryType: 'FeeSettings'
  /**
   * A bit-map of boolean flags for this object. No flags are defined for this type.
   */
  Flags: 0
}

/**
 * The FeeSettings object type contains the current base transaction cost and
 * reserve amounts as determined by fee voting.
 *
 * The fields will be based on the status of the `XRPFees` amendment.
 * - Before: {@link FeeSettingsPreAmendmentFields}
 * - After: {@link FeeSettingsPostAmendmentFields}
 *
 * @interface
 *
 * @category Ledger Entries
 */
type FeeSettings = FeeSettingsBase &
  (FeeSettingsPreAmendmentFields | FeeSettingsPostAmendmentFields)

export default FeeSettings
