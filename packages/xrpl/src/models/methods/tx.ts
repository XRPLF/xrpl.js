import { Transaction, TransactionMetadata } from '../transactions'
import { BaseTransaction } from '../transactions/common'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The tx method retrieves information on a single transaction, by its
 * identifying hash. Expects a response in the form of a {@link TxResponse}.
 *
 * @category Requests
 */
export interface TxRequest extends BaseRequest {
  command: 'tx'
  transaction: string
  /**
   * If true, return transaction data and metadata as binary serialized to
   * hexadecimal strings. If false, return transaction data and metadata as.
   * JSON. The default is false.
   */
  binary?: boolean
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
 * Response expected from a {@link TxRequest}.
 *
 * @category Responses
 */
export interface TxResponse<T extends BaseTransaction = Transaction>
  extends BaseResponse {
  result: {
    /** The SHA-512 hash of the transaction. */
    hash: string
    /** The ledger index of the ledger that includes this transaction. */
    ledger_index?: number
    /** Transaction metadata, which describes the results of the transaction.
     *  Can be undefined if a transaction has not been validated yet. */
    meta?: TransactionMetadata | string
    /**
     * If true, this data comes from a validated ledger version; if omitted or.
     * Set to false, this data is not final.
     */
    validated?: boolean
    /**
     * This number measures the number of seconds since the "Ripple Epoch" of January 1, 2000 (00:00 UTC)
     */
    date?: number
  } & T
  /**
   * If true, the server was able to search all of the specified ledger
   * versions, and the transaction was in none of them. If false, the server did
   * not have all of the specified ledger versions available, so it is not sure.
   * If one of them might contain the transaction.
   */
  searched_all?: boolean
}
