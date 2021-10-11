import { LedgerIndex } from '../common'
import { Transaction } from '../transactions'
import TransactionMetadata from '../transactions/metadata'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `transaction_entry` method retrieves information on a single transaction
 * from a specific ledger version. Expects a response in the form of a
 * {@link TransactionEntryResponse}.
 *
 * @category Requests
 */
export interface TransactionEntryRequest extends BaseRequest {
  command: 'transaction_entry'
  /** A 20-byte hex string for the ledger version to use. */
  ledger_hash?: string
  /**
   * The ledger index of the ledger to use, or a shortcut string to choose a
   * ledger automatically.
   */
  ledger_index?: LedgerIndex
  /** Unique hash of the transaction you are looking up. */
  tx_hash: string
}

/**
 * Response expected from a {@link TransactionEntryRequest}.
 *
 * @category Responses
 */
export interface TransactionEntryResponse extends BaseResponse {
  result: {
    /**
     * The identifying hash of the ledger version the transaction was found in;
     * this is the same as the one from the request.
     */
    ledger_hash: string
    /**
     * The ledger index of the ledger version the transaction was found in;
     * this is the same as the one from the request.
     */
    ledger_index: number
    /**
     * The transaction metadata, which shows the exact results of the
     * transaction in detail.
     */
    metadata: TransactionMetadata
    /** JSON representation of the Transaction object. */
    tx_json: Transaction
  }
}
