import { AccountRoot, SignerList } from '../ledger'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * The `account_info` command retrieves information about an account, its
 * activity, and its XRP balance. All information retrieved is relative to a
 * particular version of the ledger. Returns an {@link AccountInfoResponse}.
 *
 * @category Requests
 */
export interface AccountInfoRequest extends BaseRequest, LookupByLedgerRequest {
  command: 'account_info'
  /** A unique identifier for the account, most commonly the account's address. */
  account: string
  /**
   * Whether to get info about this account's queued transactions. Can only be
   * used when querying for the data from the current open ledger. Not available
   * from servers in Reporting Mode.
   */
  queue?: boolean
  /**
   * Request SignerList objects associated with this account.
   */
  signer_lists?: boolean
  /**
   * If true, then the account field only accepts a public key or XRP Ledger
   * address. Otherwise, account can be a secret or passphrase (not
   * recommended). The default is false.
   */
  strict?: boolean
}

interface QueueTransaction {
  /**
   * Whether this transaction changes this address's ways of authorizing
   * transactions.
   */
  auth_change: boolean
  /** The Transaction Cost of this transaction, in drops of XRP. */
  fee: string
  /**
   * The transaction cost of this transaction, relative to the minimum cost for
   * this type of transaction, in fee levels.
   */
  fee_level: string
  /** The maximum amount of XRP, in drops, this transaction could send or destroy. */
  max_spend_drops: string
  /** The Sequence Number of this transaction. */
  seq: number
}

interface QueueData {
  /** Number of queued transactions from this address. */
  txn_count: number
  /**
   * Whether a transaction in the queue changes this address's ways of
   * authorizing transactions. If true, this address can queue no further
   * transactions until that transaction has been executed or dropped from the
   * queue.
   */
  auth_change_queued?: boolean
  /** The lowest Sequence Number among transactions queued by this address. */
  lowest_sequence?: number
  /** The highest Sequence Number among transactions queued by this address. */
  highest_sequence?: number
  /**
   * Integer amount of drops of XRP that could be debited from this address if
   * every transaction in the queue consumes the maximum amount of XRP possible.
   */
  max_spend_drops_total?: string
  /** Information about each queued transaction from this address. */
  transactions?: QueueTransaction[]
}

/**
 * Response expected from an {@link AccountInfoRequest}.
 *
 * @category Responses
 */
export interface AccountInfoResponse extends BaseResponse {
  result: {
    /**
     * The AccountRoot ledger object with this account's information, as stored
     * in the ledger.
     * If requested, also includes Array of SignerList ledger objects
     * associated with this account for Multi-Signing. Since an account can own
     * at most one SignerList, this array must have exactly one member if it is
     * present.
     */
    account_data: AccountRoot & { signer_lists?: SignerList[] }
    /**
     * The ledger index of the current in-progress ledger, which was used when
     * retrieving this information.
     */
    ledger_current_index?: number
    /**
     * The ledger index of the ledger version used when retrieving this
     * information. The information does not contain any changes from ledger
     * versions newer than this one.
     */
    ledger_index?: number
    /**
     * Information about queued transactions sent by this account. This
     * information describes the state of the local rippled server, which may be
     * different from other servers in the peer-to-peer XRP Ledger network. Some
     * fields may be omitted because the values are calculated "lazily" by the
     * queuing mechanism.
     */
    queue_data?: QueueData
    /**
     * True if this data is from a validated ledger version; if omitted or set
     * to false, this data is not final.
     */
    validated?: boolean
  }
}
