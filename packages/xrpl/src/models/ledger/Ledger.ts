import { APIVersion, DEFAULT_API_VERSION, RIPPLED_API_V1 } from '../common'
import { Transaction, TransactionMetadata } from '../transactions'

import { LedgerEntry } from './LedgerEntry'

/**
 * Common properties for ledger entries.
 *
 * @category Ledger Entries
 */
interface BaseLedger {
  /** The SHA-512Half of this ledger's state tree information. */
  account_hash: string
  /** All the state information in this ledger. Admin only. */
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
  /**
   * The approximate time this ledger was closed, in date time string format.
   * Always uses the UTC time zone.
   */
  close_time_iso: string
  /** Whether or not this ledger has been closed. */
  closed: boolean
  /**
   * The SHA-512Half of this ledger version. This serves as a unique identifier
   * for this ledger and all its contents.
   */
  ledger_hash: string
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
}

/**
 * Expanded transaction format in API version 2.
 * Transactions are returned as flat objects with the transaction fields
 * directly on the object, plus `hash` and `metaData`.
 */
export type LedgerTransactionExpanded = Transaction & {
  hash: string
  metaData?: TransactionMetadata
}

/**
 * Expanded transaction format in API version 1.
 * Transactions are wrapped in an object with `tx_json` and `meta` fields.
 */
export interface LedgerTransactionExpandedV1 {
  tx_json: Transaction
  meta: TransactionMetadata
  hash: string
  validated: boolean
  ledger_index: number
  close_time_iso: string
  ledger_hash: string
}

/**
 * A ledger is a block of transactions and shared state data. It has a unique
 * header that describes its contents using cryptographic hashes.
 *
 * @category Ledger Entries
 */
export interface Ledger extends BaseLedger {
  /**
   * The ledger index of the ledger. Represented as a number.
   */
  ledger_index: number
  /**
   * Transactions applied in this ledger version. When expanded, members are
   * full representations of the transactions as flat objects with the
   * transaction fields directly on the object, plus `hash` and `metaData`.
   */
  transactions?: Array<string | LedgerTransactionExpanded>
}

/**
 * A ledger is a block of transactions and shared state data. It has a unique
 * header that describes its contents using cryptographic hashes. This is used
 * in api_version 1.
 *
 * @category Ledger Entries
 */
export interface LedgerV1 extends BaseLedger {
  /**
   * The ledger index of the ledger. Some API methods display this as a quoted
   * integer; some display it as a number.
   */
  ledger_index: string
  /**
   * Transactions applied in this ledger version. When expanded, members are
   * full representations of the transactions wrapped in objects with
   * `tx_json` and `meta` fields.
   */
  transactions?: Array<string | LedgerTransactionExpandedV1>
}

/**
 * Type to map between the API version and the Ledger type.
 *
 * @category Responses
 */
export type LedgerVersionMap<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
> = Version extends typeof RIPPLED_API_V1 ? LedgerV1 : Ledger
