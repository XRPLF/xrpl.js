import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

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
   * A bit-map of boolean flags. No flags are currently defined for
   * Sponsorship objects, so this value is always 0.
   */
  Flags: 0
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
   * The cumulative amount of fees (in drops) that the sponsor has paid on
   * behalf of the sponsee. This field tracks the total fees paid and is
   * updated each time the sponsor pays a transaction fee for the sponsee.
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
  ReserveCount?: number
}
