import { Hook as WHook } from '../common'

import BaseLedgerEntry from './BaseLedgerEntry'

/**
 * The Hook object type contains the
 *
 * @category Ledger Entries
 */
export default interface Hook extends BaseLedgerEntry {
  LedgerEntryType: 'Hook'

  /** The identifying (classic) address of this account. */
  Account: string

  /**
   * A hint indicating which page of the sender's owner directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string

  PreviousTxnID: string

  PreviousTxnLgrSeq: number

  Hooks: WHook[]
}
