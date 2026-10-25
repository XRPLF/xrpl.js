import { BaseLedgerEntry } from './BaseLedgerEntry'

/**
 * (AMMCurves) The AMMTickBitmap object type records which ticks of a window of
 * 256 ticks of a concentrated liquidity AMM are initialized. Only windows that
 * hold at least one initialized tick have an entry.
 *
 * @category Ledger Entries
 */
export default interface AMMTickBitmap extends BaseLedgerEntry {
  LedgerEntryType: 'AMMTickBitmap'
  /**
   * The ledger entry ID of the AMM the bitmap belongs to.
   */
  AMMID: string
  /**
   * The index of the 256-tick window: `(tick + 887272) / 256`, from 0 to 6931.
   */
  BitmapWordIndex: number
  /**
   * The 256-bit bitmap, as hex. Bit `i`, counted from the least significant bit,
   * is set when tick `BitmapWordIndex * 256 + i - 887272` is initialized.
   */
  BitmapBits: string
  /**
   * Always 0: this object is not placed in any owner directory.
   */
  OwnerNode: string
  /**
   * A bit-map of boolean flags. No flags are defined for the AMMTickBitmap
   * object type, so this value is always 0.
   */
  Flags: 0
}
