import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * A DepositPreauth object tracks a preauthorization from one account to
 * another. DepositPreauth transactions create these objects.
 *
 * @category Ledger Entries
 */
export default interface DepositPreauth
  extends BaseLedgerEntry,
    HasPreviousTxnID {
  LedgerEntryType: 'DepositPreauth'
  /** The account that granted the preauthorization. */
  Account: string
  /** The account that received the preauthorization. */
  Authorize: string
  /**
   * A bit-map of boolean flags. No flags are defined for DepositPreauth
   * objects, so this value is always 0.
   */
  Flags: 0
  /**
   * A hint indicating which page of the sender's owner directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
}
