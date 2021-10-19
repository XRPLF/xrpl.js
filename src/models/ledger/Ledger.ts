import { Transaction, TransactionMetadata } from '../transactions'

import LedgerEntry from './LedgerEntry'

/**
 * A ledger is a block of transactions and shared state data. It has a unique
 * header that describes its contents using cryptographic hashes.
 *
 * @category Ledger Entries
 */
export default interface Ledger {
  /** The SHA-512Half of this ledger's state tree information. */
  account_hash: string
  /** All the state information in this ledger. */
  accountState?: LedgerEntry[]
  /** A bit-map of flags relating to the closing of this ledger. */
  close_flags: number
  /**
   * The approximate time this ledger version closed, as the number of seconds
   * since the Ripple Epoch of 2000-01-01 00:00:00. This value is rounded based
   * on the close_time_resolution.
   */
  close_time: number
  /**
   * The approximate time this ledger was closed, in human-readable format.
   * Always uses the UTC time zone.
   */
  close_time_human: string
  /**
   * An integer in the range [2,120] indicating the maximum number of seconds
   * by which the close_time could be rounded.
   */
  close_time_resolution: number
  /** Whether or not this ledger has been closed. */
  closed: boolean
  /**
   * The SHA-512Half of this ledger version. This serves as a unique identifier
   * for this ledger and all its contents.
   */
  ledger_hash: string
  /**
   * The ledger index of the ledger. Some API methods display this as a quoted
   * integer; some display it as a native JSON number.
   */
  ledger_index: string
  /** The approximate time at which the previous ledger was closed. */
  parent_close_time: number
  /**
   * Unique identifying hash of the ledger that came immediately before this
   * one.
   */
  parent_hash: string
  /** Total number of XRP drops in the network, as a quoted integer. */
  total_coins: string
  /** Hash of the transaction information included in this ledger, as hex. */
  transaction_hash: string
  /**
   * Transactions applied in this ledger version. By default, members are the
   * transactions' identifying Hash strings. If the request specified expand as
   * true, members are full representations of the transactions instead, in
   * either JSON or binary depending on whether the request specified binary
   * as true.
   */
  transactions?: Array<Transaction & { metaData?: TransactionMetadata }>
}
