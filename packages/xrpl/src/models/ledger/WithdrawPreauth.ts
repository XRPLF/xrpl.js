import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The WithdrawPreauth object type preauthorizes one destination (and
 * destination tag) that a firewalled account may send value to without its
 * Firewall's Counterparty co-signing.
 *
 * This ledger entry shares its name with the WithdrawPreauth transaction; it
 * is exported only through the `LedgerEntry` namespace, as `LedgerEntry.WithdrawPreauth`.
 *
 * @category Ledger Entries
 */
export default interface WithdrawPreauth
  extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'WithdrawPreauth'
  /**
   * The firewalled account that granted the preauthorization.
   */
  Account: string
  /**
   * The preauthorized destination.
   */
  Authorize: string
  /**
   * The preauthorized destination tag; the transactors record 0 when the
   * transaction carried none.
   */
  DestinationTag?: number
  /**
   * A hint indicating which page of the Account's owner directory links to
   * this object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /**
   * A bit-map of boolean flags. No flags are defined for WithdrawPreauth
   * objects.
   */
  Flags: number
  /**
   * The account sponsoring the reserve for this WithdrawPreauth.
   */
  Sponsor?: string
}
