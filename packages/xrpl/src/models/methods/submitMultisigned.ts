import { APIVersion, DEFAULT_API_VERSION, RIPPLED_API_V1 } from '../common'
import { Transaction } from '../transactions'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `submit_multisigned` command applies a multi-signed transaction and sends
 * it to the network to be included in future ledgers. Expects a response in the
 * form of a {@link SubmitMultisignedRequest}.
 *
 * @category Requests
 */
export interface SubmitMultisignedRequest extends BaseRequest {
  command: 'submit_multisigned'
  /**
   * Transaction in JSON format with an array of Signers. To be successful, the
   * weights of the signatures must be equal or higher than the quorum of the.
   * {@link Transaction Type/SignerList}.
   */
  tx_json: Transaction
  /**
   * If true, and the transaction fails locally, do not retry or relay the
   * transaction to other servers.
   */
  fail_hard?: boolean
}

/**
 * Common properties for multisigned transaction responses.
 *
 * @category Responses
 */
interface BaseSubmitMultisignedResult {
  /**
   * Code indicating the preliminary result of the transaction, for example.
   * `tesSUCCESS`.
   */
  engine_result: string
  /**
   * Numeric code indicating the preliminary result of the transaction,
   * directly correlated to `engine_result`.
   */
  engine_result_code: number
  /** Human-readable explanation of the preliminary transaction result. */
  engine_result_message: string
  /** The complete transaction in hex string format. */
  tx_blob: string
  /** The complete transaction in JSON format. */
  tx_json: Transaction
}

/**
 * Response expected from a {@link SubmitMultisignedRequest}.
 *
 * @category Responses
 */
export interface SubmitMultisignedResponse extends BaseResponse {
  result: BaseSubmitMultisignedResult & {
    hash?: string
  }
}

/**
 * Response expected from a {@link SubmitMultisignedRequest} using api_version 1.
 *
 * @category ResponsesV1
 */
export interface SubmitMultisignedV1Response extends BaseResponse {
  result: BaseSubmitMultisignedResult & {
    tx_json: Transaction & { hash?: string }
  }
}

/**
 * Type to map between the API version and the response type.
 *
 * @category Responses
 */
export type SubmitMultisignedVersionResponseMap<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
> = Version extends typeof RIPPLED_API_V1
  ? SubmitMultisignedV1Response
  : SubmitMultisignedResponse
