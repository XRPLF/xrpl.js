import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The Firewall object type blocks an account's outgoing value until its
 * Counterparty co-signs, or the destination is preauthorized with a
 * WithdrawPreauth object.
 *
 * @category Ledger Entries
 */
export default interface Firewall extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Firewall'
  /**
   * The firewalled account that owns this object.
   */
  Owner: string
  /**
   * The account that must co-sign the Owner's outgoing value and any change to
   * this Firewall.
   */
  Counterparty: string
  /**
   * The highest fee, in drops of XRP, a firewalled transaction may pay without
   * the Counterparty's signature.
   */
  MaxFee?: string
  /**
   * A hint indicating which page of the Owner's directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /**
   * A bit-map of boolean flags. No flags are defined for Firewall objects.
   */
  Flags: number
  /**
   * The account sponsoring the reserve for this Firewall.
   */
  Sponsor?: string
}
