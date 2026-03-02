import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * The deposit_authorized command indicates whether one account is authorized to
 * send payments directly to another. Expects a response in the form of a {@link
 * DepositAuthorizedResponse}.
 *
 * @category Requests
 */
export interface DepositAuthorizedRequest
  extends BaseRequest,
    LookupByLedgerRequest {
  command: 'deposit_authorized'
  /** The sender of a possible payment. */
  source_account: string
  /** The recipient of a possible payment. */
  destination_account: string
  /**
   * The object IDs of Credential objects. If this field is included, then the
   * credential will be taken into account when analyzing whether the sender can send
   * funds to the destination.
   */
  credentials?: string[]
}

/**
 * Expected response from a {@link DepositAuthorizedRequest}.
 *
 * @category Responses
 */
export interface DepositAuthorizedResponse extends BaseResponse {
  result: {
    /**
     * Whether the specified source account is authorized to send payments
     * directly to the destination account. If true, either the destination
     * account does not require Deposit Authorization or the source account is
     * preauthorized.
     */
    deposit_authorized: boolean
    /** The destination account specified in the request. */
    destination_account: string
    /**
     * The identifying hash of the ledger that was used to generate this
     * Response.
     */
    ledger_hash?: string
    /**
     * The ledger index of the ledger version that was used to generate this
     * Response.
     */
    ledger_index?: number
    /**
     * The ledger index of the current in-progress ledger version, which was
     * used to generate this response.
     */
    ledger_current_index?: number
    /** The source account specified in the request. */
    source_account: string
    /** If true, the information comes from a validated ledger version. */
    validated?: boolean
    /** The object IDs of `Credential` objects. If this field is included,
     * then the credential will be taken into account when analyzing whether
     * the sender can send funds to the destination. */
    credentials?: string[]
  }
}
