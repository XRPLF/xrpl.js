import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * Enum for Sponsorship ledger entry flags.
 *
 * @category Ledger Entry Flags
 */
export enum SponsorshipFlags {
  /**
   * If set, requires the sponsee to sign (approve) any transaction
   * where the sponsor pays the transaction fee.
   */
  lsfSponsorshipRequireSignForFee = 0x00010000,
  /**
   * If set, requires the sponsee to sign (approve) any transaction
   * where the sponsor pays for reserves (e.g., creating new ledger objects).
   */
  lsfSponsorshipRequireSignForReserve = 0x00020000,
}

/**
 * The Sponsorship object type represents a sponsorship relationship between
 * two accounts, where the sponsor (Owner) pays fees and/or reserves on behalf
 * of the sponsee.
 *
 * @category Ledger Entries
 */
export default interface Sponsorship extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Sponsorship'
  /**
   * The account that is sponsoring (paying fees/reserves).
   * This is the owner of the Sponsorship object.
   */
  Owner: string
  /**
   * The account being sponsored (receiving fee/reserve coverage).
   */
  Sponsee: string
  /**
   * A bit-map of boolean flags. Possible flags include:
   * - lsfSponsorshipRequireSignForFee (0x00010000): Requires sponsee signature for fee sponsorship
   * - lsfSponsorshipRequireSignForReserve (0x00020000): Requires sponsee signature for reserve sponsorship
   */
  Flags: number
  /**
   * A hint indicating which page of the sponsor's owner directory links to
   * this object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /**
   * A hint indicating which page of the sponsee's owner directory links to
   * this object, in case the directory consists of multiple pages.
   */
  SponseeNode: string
  /**
   * The amount of XRP (in drops) available for paying transaction fees on
   * behalf of the sponsee. This is a pre-funded balance that gets decremented
   * when the sponsor pays fees for the sponsee's transactions.
   */
  FeeAmount?: string
  /**
   * The maximum fee (in drops) that the sponsor is willing to pay per
   * transaction on behalf of the sponsee. If not specified, there is no
   * per-transaction limit.
   */
  MaxFee?: string
  /**
   * The number of ledger objects for which the sponsor is paying reserves
   * on behalf of the sponsee. This count is incremented when the sponsor
   * pays for object creation and decremented when sponsored objects are
   * deleted. Default value is 0.
   */
  RemainingOwnerCount?: number
  /**
   * (Optional) The account sponsoring the reserve for this Sponsorship
   * object itself. If present, the sponsor is responsible for the reserve
   * requirement of this object instead of the owner.
   */
  Sponsor?: string
}
