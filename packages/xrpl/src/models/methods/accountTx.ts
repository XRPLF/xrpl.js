import {
  APIVersion,
  DEFAULT_API_VERSION,
  RIPPLED_API_V1,
  RIPPLED_API_V2,
  ResponseOnlyTxInfo,
} from '../common'
import { Transaction, TransactionMetadata } from '../transactions'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * The account_tx method retrieves a list of transactions that involved the
 * specified account. Expects a response in the form of a {@link
 * AccountTxResponse}.
 *
 * @category Requests
 */
export interface AccountTxRequest extends BaseRequest, LookupByLedgerRequest {
  command: 'account_tx'
  /** A unique identifier for the account, most commonly the account's address. */
  account: string
  /**
   * Use to specify the earliest ledger to include transactions from. A value
   * of -1 instructs the server to use the earliest validated ledger version
   * available.
   */
  ledger_index_min?: number
  /**
   * Use to specify the most recent ledger to include transactions from. A
   * value of -1 instructs the server to use the most recent validated ledger
   * version available.
   */
  ledger_index_max?: number
  /**
   * If true, return transactions as hex strings instead of JSON. The default is
   * false.
   */
  binary?: boolean
  /**
   * If true, returns values indexed with the oldest ledger first. Otherwise,
   * the results are indexed with the newest ledger first.
   */
  forward?: boolean
  /**
   * Default varies. Limit the number of transactions to retrieve. The server
   * is not required to honor this value.
   */
  limit?: number
  /**
   * Value from a previous paginated response. Resume retrieving data where
   * that response left off. This value is stable even if there is a change in
   * the server's range of available ledgers.
   */
  marker?: unknown
}

export interface AccountTxTransaction<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
> {
  /** The ledger index of the ledger version that included this transaction. */
  ledger_index: number
  /**
   * If binary is True, then this is a hex string of the transaction metadata.
   * Otherwise, the transaction metadata is included in JSON format.
   */
  meta: string | TransactionMetadata
  /** JSON object defining the transaction. */
  tx_json?: Version extends typeof RIPPLED_API_V2
    ? Transaction & ResponseOnlyTxInfo
    : never
  /** JSON object defining the transaction in rippled API v1. */
  tx?: Version extends typeof RIPPLED_API_V1
    ? Transaction & ResponseOnlyTxInfo
    : never
  /** The hash of the transaction. */
  hash?: Version extends typeof RIPPLED_API_V2 ? string : never
  /** Unique hashed String representing the transaction. */
  tx_blob?: string
  /**
   * Whether or not the transaction is included in a validated ledger. Any
   * transaction not yet in a validated ledger is subject to change.
   */
  validated: boolean
}

/**
 * Base interface for account transaction responses.
 */
export interface AccountTxResponseBase<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
> extends BaseResponse {
  result: {
    /** Unique Address identifying the related account. */
    account: string
    /**
     * The ledger index of the earliest ledger actually searched for
     * transactions.
     */
    ledger_index_min: number
    /**
     * The ledger index of the most recent ledger actually searched for
     * transactions.
     */
    ledger_index_max: number
    /** The limit value used in the request. */
    limit: number
    /**
     * Server-defined value indicating the response is paginated. Pass this
     * to the next call to resume where this call left off.
     */
    marker?: unknown
    /**
     * Array of transactions matching the request's criteria, as explained
     * below.
     */
    transactions: Array<AccountTxTransaction<Version>>
    /**
     * If included and set to true, the information in this response comes from
     * a validated ledger version. Otherwise, the information is subject to
     * change.
     */
    validated?: boolean
  }
}

/**
 * Expected response from an {@link AccountTxRequest}.
 *
 * @category Responses
 */
export type AccountTxResponse = AccountTxResponseBase

/**
 * Expected response from an {@link AccountTxRequest} with `api_version` set to 1.
 *
 * @category ResponsesV1
 */
export type AccountTxV1Response = AccountTxResponseBase<typeof RIPPLED_API_V1>

/**
 * Type to map between the API version and the response type.
 *
 * @category Responses
 */
export type AccountTxVersionResponseMap<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
> = Version extends typeof RIPPLED_API_V1
  ? AccountTxV1Response
  : AccountTxResponse
