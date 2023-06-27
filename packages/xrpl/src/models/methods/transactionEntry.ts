import { ResponseOnlyTxInfo } from '../common'
import { Transaction, TransactionMetadata } from '../transactions'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * The `transaction_entry` method retrieves information on a single transaction
 * from a specific ledger version. Expects a response in the form of a
 * {@link TransactionEntryResponse}.
 *
 * @category Requests
 */
export interface TransactionEntryRequest
  extends BaseRequest,
    LookupByLedgerRequest {
  command: 'transaction_entry'

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
    tx_json: Transaction & ResponseOnlyTxInfo
  }
}
