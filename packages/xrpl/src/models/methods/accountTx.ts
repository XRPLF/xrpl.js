import {
  APIVersion,
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

export interface AccountTxTransaction<Version extends APIVersion> {
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
  /** JSON object defining the transaction. */
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
interface AccountTxResponseBase<Version extends APIVersion>
  extends BaseResponse {
  result: {
    account: string
    ledger_index_min: number
    ledger_index_max: number
    limit: number
    marker?: unknown
    transactions: Array<AccountTxTransaction<Version>>
    validated?: boolean
  }
}

/**
 * Expected response from an {@link AccountTxRequest}.
 *
 * @category Responses
 */
export type AccountTxResponse = AccountTxResponseBase<typeof RIPPLED_API_V2>

/**
 * Expected response from an {@link AccountTxRequest} with `api_version` set to 1.
 *
 * @category Responses
 */
export type AccountTxV1Response = AccountTxResponseBase<typeof RIPPLED_API_V1>

/**
 * Type to map between the API version and the response type.
 *
 * @category Responses
 */
export type AccountTxVersionResponseMap<Version extends APIVersion> =
  Version extends typeof RIPPLED_API_V1
    ? AccountTxV1Response
    : AccountTxResponse
