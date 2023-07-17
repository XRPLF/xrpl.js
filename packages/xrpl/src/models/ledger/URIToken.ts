import { Amount } from '../common'

import BaseLedgerEntry from './BaseLedgerEntry'

/**
 * The URIToken object type contains the
 *
 * @category Ledger Entries
 */
export default interface URIToken extends BaseLedgerEntry {
  LedgerEntryType: 'URIToken'

  /**
   */
  Owner: string

  /**
   * A hint indicating which page of the sender's owner directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string

  /**
   */
  Issuer: string

  /**
   */
  URI: string

  /**
   */
  Digest: string

  /**
   */
  Amount: Amount

  /**
   */
  Destination: string

  /**
   * The identifying hash of the transaction that most recently modified this
   * object.
   */
  PreviousTxnID: string
  /**
   * The index of the ledger that contains the transaction that most recently
   * modified this object.
   */
  PreviousTxnLgrSeq: number
}
