import { SubmittableTransaction } from '../transactions'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The submit method applies a transaction and sends it to the network to be
 * confirmed and included in future ledgers. Expects a response in the form of a
 * {@link SubmitResponse}.
 *
 * @category Requests
 */
export interface SubmitRequest extends BaseRequest {
  command: 'submit'
  /** The complete transaction in hex string format. */
  tx_blob: string
  /**
   * If true, and the transaction fails locally, do not retry or relay the
   * transaction to other servers. The default is false.
   */
  fail_hard?: boolean
}

/**
 * Response expected from a {@link SubmitRequest}.
 *
 * @category Responses
 */
export interface SubmitResponse extends BaseResponse {
  result: {
    /**
     * Text result code indicating the preliminary result of the transaction,
     * for example `tesSUCCESS`.
     */
    engine_result: string
    /** Numeric version of the result code. */
    engine_result_code: number
    /** Human-readable explanation of the transaction's preliminary result. */
    engine_result_message: string
    /** The complete transaction in hex string format. */
    tx_blob: string
    /** The complete transaction in JSON format. */
    tx_json: SubmittableTransaction & { hash?: string }
    /**
     * The value true indicates that the transaction was applied, queued,
     * broadcast, or kept for later. The value `false` indicates that none of
     * those happened, so the transaction cannot possibly succeed as long as you
     * do not submit it again and have not already submitted it another time.
     */
    accepted: boolean
    /**
     * The next Sequence Number available for the sending account after all
     * pending and queued transactions.
     */
    account_sequence_available: number
    /**
     * The next Sequence number for the sending account after all transactions
     * that have been provisionally applied, but not transactions in the queue.
     */
    account_sequence_next: number
    /**
     * The value true indicates that this transaction was applied to the open
     * ledger. In this case, the transaction is likely, but not guaranteed, to
     * be validated in the next ledger version.
     */
    applied: boolean
    /**
     * The value true indicates this transaction was broadcast to peer servers
     * in the peer-to-peer XRP Ledger network.
     */
    broadcast: boolean
    /**
     * The value true indicates that the transaction was kept to be retried
     * later.
     */
    kept: boolean
    /**
     * The value true indicates the transaction was put in the Transaction
     * Queue, which means it is likely to be included in a future ledger
     * version.
     */
    queued: boolean
    /**
     * The current open ledger cost before processing this transaction
     * transactions with a lower cost are likely to be queued.
     */
    open_ledger_cost: string
    /**
     * The ledger index of the newest validated ledger at the time of
     * submission. This provides a lower bound on the ledger versions that the
     * transaction can appear in as a result of this request.
     */
    validated_ledger_index: number
  }
}
