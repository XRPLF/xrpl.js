import { Transaction } from '../transactions'

import BaseLedgerEntry from './BaseLedgerEntry'

/**
 * The EmittedTxn object type contains the
 *
 * @category Ledger Entries
 */
export default interface EmittedTxn extends BaseLedgerEntry {
  LedgerEntryType: 'EmittedTxn'

  EmittedTxn: Transaction

  /**
   * A hint indicating which page of the sender's owner directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string
}
