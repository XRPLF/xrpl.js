import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The Ticket object type represents a Ticket, which tracks an account sequence
 * number that has been set aside for future use. You can create new tickets
 * with a TicketCreate transaction.
 *
 * @category Ledger Entries
 */
export default interface Ticket extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Ticket'
  /** The account that owns this Ticket. */
  Account: string
  /**
   * A bit-map of Boolean flags enabled for this Ticket. Currently, there are
   * no flags defined for Tickets.
   */
  Flags: number
  /**
   * A hint indicating which page of the owner directory links to this object,
   * in case the directory consists of multiple pages.
   */
  OwnerNode: string
  /** The Sequence Number this Ticket sets aside. */
  TicketSequence: number
}
