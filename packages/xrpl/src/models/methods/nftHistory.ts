import {
  APIVersion,
  DEFAULT_API_VERSION,
  ResponseOnlyTxInfo,
  RIPPLED_API_V2,
} from '../common'
import { Transaction, TransactionMetadata } from '../transactions'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * The nft_history method retrieves a list of transactions that involved the
 * specified NFToken. Expects a response in the form of a {@link
 * NFTHistoryResponse}.
 *
 * @category Requests
 */
export interface NFTHistoryRequest<Binary extends boolean = false>
  extends BaseRequest,
    LookupByLedgerRequest {
  command: 'nft_history'
  /**
   * The unique identifier of an NFToken.
   */
  nft_id: string
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
  binary?: Binary
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

interface NFTHistoryTransactionBase {
  /**
   * Whether or not the transaction is included in a validated ledger. Any
   * transaction not yet in a validated ledger is subject to change.
   */
  validated: boolean
}

export type NFTHistoryTransaction<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
  Binary extends boolean = false,
> = NFTHistoryTransactionBase &
  (Version extends typeof RIPPLED_API_V2
    ? Binary extends true
      ? {
          /** Hex string of the transaction metadata. */
          meta_blob: string
          /** Unique hashed String representing the transaction. */
          tx_blob: string
          /** The ledger index of the ledger version that included this transaction. */
          ledger_index: number
          date: number
        }
      : {
          /** JSON object defining the transaction. */
          tx_json: Transaction & ResponseOnlyTxInfo
          /** The transaction metadata in JSON format. */
          meta: TransactionMetadata
          /** The ledger index of the ledger version that included this transaction. */
          ledger_index: number
          hash: string
          close_time_iso: string
          ledger_hash: string
        }
    : Binary extends true
    ? {
        /** Unique hashed String representing the transaction. */
        tx_blob: string
        /** Hex string of the transaction metadata. */
        meta: string
        /** The ledger index of the ledger version that included this transaction. */
        ledger_index: number
        date: number
      }
    : {
        /** JSON object defining the transaction. */
        tx: Transaction & ResponseOnlyTxInfo
        /** The transaction metadata in JSON format. */
        meta: TransactionMetadata
      })

/**
 * Expected response from an {@link NFTHistoryRequest}.
 *
 * @category Responses
 */
export interface NFTHistoryResponse<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
  Binary extends boolean = false,
> extends BaseResponse {
  result: {
    /**
     * The unique identifier of an NFToken.
     */
    nft_id: string
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
    limit?: number
    /**
     * Server-defined value indicating the response is paginated. Pass this
     * to the next call to resume where this call left off.
     */
    marker?: unknown
    /**
     * Array of transactions matching the request's criteria, as explained
     * below.
     */
    transactions: Array<NFTHistoryTransaction<Version, Binary>>
    /**
     * If included and set to true, the information in this response comes from
     * a validated ledger version. Otherwise, the information is subject to
     * change.
     */
    validated?: boolean
  }
}
