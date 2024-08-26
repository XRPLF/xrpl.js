import { APIVersion, DEFAULT_API_VERSION, RIPPLED_API_V1 } from '../common'
import { Ledger, LedgerV1, LedgerVersionMap } from '../ledger/Ledger'
import { LedgerEntryFilter } from '../ledger/LedgerEntry'
import { Transaction, TransactionAndMetadata } from '../transactions'
import { TransactionMetadata } from '../transactions/metadata'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * Retrieve information about the public ledger. Expects a response in the form
 * of a {@link LedgerResponse}.
 *
 * @example
 * ```ts
 * const ledger: LedgerRequest = {
 *  "id": 14,
 *  "command": "ledger",
 *  "ledger_index": "validated",
 *  "full": false,
 *  "accounts": false,
 *  "transactions": false,
 *  "expand": false,
 *  "owner_funds": false
 * }
 * ```
 *
 * @category Requests
 */
export interface LedgerRequest extends BaseRequest, LookupByLedgerRequest {
  command: 'ledger'
  /**
   * Admin required If true, return full information on the entire ledger.
   * Ignored if you did not specify a ledger version. Defaults to false.
   */
  full?: boolean
  /**
   * Admin required. If true, return information on accounts in the ledger.
   * Ignored if you did not specify a ledger version. Defaults to false.
   */
  accounts?: boolean
  /**
   * If true, return information on transactions in the specified ledger
   * version. Defaults to false. Ignored if you did not specify a ledger
   * version.
   */
  transactions?: boolean
  /**
   * Provide full JSON-formatted information for transaction/account
   * information instead of only hashes. Defaults to false. Ignored unless you
   * request transactions, accounts, or both.
   */
  expand?: boolean
  /**
   * If true, include owner_funds field in the metadata of OfferCreate
   * transactions in the response. Defaults to false. Ignored unless
   * transactions are included and expand is true.
   */
  owner_funds?: boolean
  /**
   * If true, and transactions and expand are both also true, return
   * transaction information in binary format (hexadecimal string) instead of
   * JSON format.
   */
  binary?: boolean
  /**
   * If true, and the command is requesting the current ledger, includes an
   * array of queued transactions in the results.
   */
  queue?: boolean
  /**
   * If included, filter results to include only this type of ledger object.
   */
  type?: LedgerEntryFilter
}

/**
 * Retrieve information about the public ledger. Expects a response in the form
 * of a {@link LedgerResponseExpanded}. Will return full JSON-formatted transaction data instead of string hashes.
 *
 * @example
 * ```ts
 * const ledger: LedgerRequest = {
 *  "id": 14,
 *  "command": "ledger",
 *  "ledger_index": "validated",
 *  "full": false,
 *  "accounts": false,
 *  "transactions": false,
 *  "expand": true,
 *  "owner_funds": false
 * }
 * ```
 *
 * @category Requests
 */
export interface LedgerRequestExpandedTransactionsOnly extends LedgerRequest {
  expand: true
  transactions: true
}

/**
 * Retrieve information about the public ledger. Expects a response in the form
 * of a {@link LedgerResponseExpanded}. Will return full JSON-formatted `accountState` data instead of string hashes.
 *
 * @example
 * ```ts
 * const ledger: LedgerRequest = {
 *  "id": 14,
 *  "command": "ledger",
 *  "ledger_index": "validated",
 *  "full": false,
 *  "accounts": true,
 *  "transactions": false,
 *  "expand": true,
 *  "owner_funds": false
 * }
 * ```
 *
 * @category Requests
 */
export interface LedgerRequestExpandedAccountsOnly extends LedgerRequest {
  expand: true
  accounts: true
}

/**
 * Retrieve information about the public ledger. Expects a response in the form
 * of a {@link LedgerResponseExpanded}. Will return full JSON-formatted `accountState` and `transactions`
 * data instead of string hashes.
 *
 * @example
 * ```ts
 * const ledger: LedgerRequest = {
 *  "id": 14,
 *  "command": "ledger",
 *  "ledger_index": "validated",
 *  "full": false,
 *  "accounts": true,
 *  "transactions": true,
 *  "expand": true,
 *  "owner_funds": false
 * }
 * ```
 *
 * @category Requests
 */
export interface LedgerRequestExpandedAccountsAndTransactions
  extends LedgerRequest {
  expand: true
  accounts: true
  transactions: true
}

/**
 * Retrieve information about the public ledger. Expects a response in the form
 * of a {@link LedgerResponse}. Will return binary (hexadecimal string) format
 * instead of JSON or string hashes for `transactions` data.
 *
 * @example
 * ```ts
 * const ledger: LedgerRequest = {
 *  "id": 14,
 *  "command": "ledger",
 *  "ledger_index": "validated",
 *  "full": false,
 *  "accounts": true,
 *  "transactions": true,
 *  "expand": true,
 *  "owner_funds": false,
 *  "binary": true
 * }
 * ```
 *
 * @category Requests
 */
export interface LedgerRequestExpandedTransactionsBinary extends LedgerRequest {
  expand: true
  transactions: true
  binary: true
}

/**
 * Special case transaction definition when the request contains `owner_funds: true`.
 */
export interface LedgerModifiedOfferCreateTransaction {
  transaction: Transaction
  metadata: TransactionMetadata & { owner_funds: string }
}

export interface LedgerQueueData {
  account: string
  tx:
    | TransactionAndMetadata
    | LedgerModifiedOfferCreateTransaction
    | { tx_blob: string }
  retries_remaining: number
  preflight_result: string
  last_result?: string
  auth_change?: boolean
  fee?: string
  fee_level?: string
  max_spend_drops?: string
}

export interface LedgerBinary
  extends Omit<Omit<Ledger, 'transactions'>, 'accountState'> {
  accountState?: string[]
  transactions?: string[]
}

export interface LedgerBinaryV1
  extends Omit<Omit<LedgerV1, 'transactions'>, 'accountState'> {
  accountState?: string[]
  transactions?: string[]
}

interface LedgerResponseBase {
  /** Unique identifying hash of the entire ledger. */
  ledger_hash: string
  /** The Ledger Index of this ledger. */
  ledger_index: number
  /**
   * If true, this is a validated ledger version. If omitted or set to false,
   * this ledger's data is not final.
   */
  queue_data?: Array<LedgerQueueData | string>
  /**
   * Array of objects describing queued transactions, in the same order as
   * the queue. If the request specified expand as true, members contain full
   * representations of the transactions, in either JSON or binary depending
   * on whether the request specified binary as true.
   */
  validated?: boolean
}

interface LedgerResponseResult extends LedgerResponseBase {
  /** The complete header data of this {@link Ledger}. */
  ledger: LedgerBinary
}

interface LedgerV1ResponseResult extends LedgerResponseBase {
  /** The complete header data of this {@link Ledger}. */
  ledger: LedgerBinaryV1
}

/**
 * Response expected from a {@link LedgerRequest}.
 * This is the default request response, triggered when `expand` and `binary` are both false.
 *
 * @category Responses
 */
export interface LedgerResponse extends BaseResponse {
  result: LedgerResponseResult
}

/**
 * Response expected from a {@link LedgerRequest}.
 * This is the default request response, triggered when `expand` and `binary` are both false.
 * This is the response for API version 1.
 *
 * @category ResponsesV1
 */
export interface LedgerV1Response extends BaseResponse {
  result: LedgerV1ResponseResult
}

/**
 * Type to map between the API version and the response type.
 *
 * @category Responses
 */
export type LedgerVersionResponseMap<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
> = Version extends typeof RIPPLED_API_V1 ? LedgerV1Response : LedgerResponse

interface LedgerResponseExpandedResult<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
> extends LedgerResponseBase {
  /** The complete header data of this {@link Ledger}. */
  ledger: LedgerVersionMap<Version>
}

/**
 * Response expected from a {@link LedgerRequest} when the request contains `expanded` is true. See {@link LedgerRequestExpanded}.
 * This response will contain full JSON-formatted data instead of string hashes.
 * The response will contain either `accounts` or `transactions` or both.
 * `binary` will be missing altogether.
 *
 * @category Responses
 */
export interface LedgerResponseExpanded<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
> extends BaseResponse {
  result: LedgerResponseExpandedResult<Version>
}
