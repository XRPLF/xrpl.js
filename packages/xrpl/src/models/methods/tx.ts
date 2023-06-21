import { Transaction, TransactionMetadata } from '../transactions'
import { BaseTransaction } from '../transactions/common'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The tx method retrieves information on a single transaction, by its
 * identifying hash. Expects a response in the form of a {@link TxResponse}.
 *
 * @category Requests
 */
export interface BaseTxRequest extends BaseRequest {
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

export interface TxRequestBinary extends BaseTxRequest {
  binary: true
}

export interface TxRequestJSON extends BaseTxRequest {
  binary?: false
}

export type TxRequest = TxRequestBinary | TxRequestJSON

export interface BaseTxResponseResult {
  /** The SHA-512 hash of the transaction. */
  hash: string
  /** The ledger index of the ledger that includes this transaction. */
  ledger_index?: number

  /**
   * If true, this data comes from a validated ledger version; if omitted or.
   * Set to false, this data is not final.
   */
  validated?: boolean
  /**
   * This number measures the number of seconds since the "Ripple Epoch" of January 1, 2000 (00:00 UTC)
   */
  date?: number
}

export type TxResponseResultBinary = BaseTxResponseResult & {
  /** Transaction metadata, which describes the results of the transaction. */
  meta: string
  tx_blob: string
}

export type TxResponseResultObject<
  T extends BaseTransaction = Transaction,
  M extends TransactionMetadata = TransactionMetadata,
> = BaseTxResponseResult & {
  /** Transaction metadata, which describes the results of the transaction. */
  meta?: M
} & T

/**
 * Response expected from a {@link TxRequest}.
 *
 * @category Responses
 */
export interface TxResponse<
  T extends BaseTransaction = Transaction,
  M extends TransactionMetadata = TransactionMetadata,
> extends BaseResponse {
  result: M extends string
    ? TxResponseResultBinary
    : TxResponseResultObject<T, M>

  /**
   * If true, the server was able to search all of the specified ledger
   * versions, and the transaction was in none of them. If false, the server did
   * not have all of the specified ledger versions available, so it is not sure.
   * If one of them might contain the transaction.
   */
  searched_all?: boolean
}
