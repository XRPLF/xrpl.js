import { APIVersion, DEFAULT_API_VERSION, RIPPLED_API_V1 } from '../common'
import { Transaction, TransactionMetadata } from '../transactions'
import { BaseTransaction } from '../transactions/common'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The tx method retrieves information on a single transaction, by its
 * identifying hash. Expects a response in the form of a {@link TxResponse}.
 *
 * @category Requests
 */
export interface TxRequest<Binary extends boolean = false> extends BaseRequest {
  command: 'tx'
  /**
   * The transaction hash to look up. Exactly one of `transaction` or `ctid` must be specified for a TxRequest.
   */
  transaction?: string
  /**
   * The Concise Transaction ID to look up. Exactly one of `transaction` or `ctid` must be specified for a TxRequest.
   */
  ctid?: string
  /**
   * If true, return transaction data and metadata as binary serialized to
   * hexadecimal strings. If false, return transaction data and metadata as.
   * JSON. The default is false.
   */
  binary?: Binary
  /**
   * Use this with max_ledger to specify a range of up to 1000 ledger indexes,
   * starting with this ledger (inclusive). If the server cannot find the
   * transaction, it confirms whether it was able to search all the ledgers in
   * this range.
   */
  min_ledger?: number
  /**
   * Use this with min_ledger to specify a range of up to 1000 ledger indexes,
   * ending with this ledger (inclusive). If the server cannot find the
   * transaction, it confirms whether it was able to search all the ledgers in
   * the requested range.
   */
  max_ledger?: number
}

/**
 * Common properties of transaction responses.
 *
 * @category Responses
 */
interface BaseTxResult {
  /** The SHA-512 hash of the transaction. */
  hash: string
  /**
   * The Concise Transaction Identifier of the transaction (16-byte hex string)
   */
  ctid?: string
  /** The ledger index of the ledger that includes this transaction. */
  ledger_index?: number
  /**
   * If true, this data comes from a validated ledger version; if omitted or.
   * Set to false, this data is not final.
   */
  validated?: boolean
  /**
   * The time the transaction was closed, in seconds since the Ripple Epoch.
   */
  close_time_iso?: string
  /**
   * This number measures the number of seconds since the "Ripple Epoch" of January 1, 2000 (00:00 UTC)
   */
  date?: number
}

/**
 * Response expected from a {@link TxRequest}.
 *
 * @category Responses
 */
export interface TxResponse<
  T extends BaseTransaction = Transaction,
  Binary extends boolean = false,
> extends BaseResponse {
  result: BaseTxResult &
    (Binary extends true
      ? {
          tx_blob: string
          /**
           * Unique hashed string Transaction metadata blob, which describes the results of the transaction.
           * Can be undefined if a transaction has not been validated yet. This field is omitted if binary
           * binary format is not requested.
           */
          meta_blob?: string
        }
      : {
          tx_json: T
          /**
           * Transaction metadata, which describes the results of the transaction.
           * Can be undefined if a transaction has not been validated yet.
           */
          meta?: TransactionMetadata<T>
        })
  /**
   * If true, the server was able to search all of the specified ledger
   * versions, and the transaction was in none of them. If false, the server did
   * not have all of the specified ledger versions available, so it is not sure.
   * If one of them might contain the transaction.
   */
  searched_all?: boolean
}

/**
 * Response expected from a {@link TxRequest} using API version 1.
 *
 * @category ResponsesV1
 */
export interface TxV1Response<
  T extends BaseTransaction = Transaction,
  Binary extends boolean = false,
> extends BaseResponse {
  result: BaseTxResult &
    (Binary extends true
      ? {
          tx: string
          /**
           * Transaction metadata, which describes the results of the transaction.
           * Can be undefined if a transaction has not been validated yet.
           */
          meta: string
        }
      : T & { meta?: TransactionMetadata<T> })
  /**
   * If true, the server was able to search all of the specified ledger
   * versions, and the transaction was in none of them. If false, the server did
   * not have all of the specified ledger versions available, so it is not sure.
   * If one of them might contain the transaction.
   */
  searched_all?: boolean
}

/**
 * Type to map between the API version and the response type.
 *
 * @category Responses
 */
export type TxVersionResponseMap<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
  Binary extends boolean = false,
> = Version extends typeof RIPPLED_API_V1
  ? TxV1Response<Transaction, Binary>
  : TxResponse<Transaction, Binary>
