import type { Request } from '.'

export interface BaseRequest {
  [x: string]: unknown
  /**
   * A unique value to identify this request. The response to this request uses
   * the same id field. This way, even if responses arrive out of order, you
   * know which request prompted which response.
   */
  id?: number | string
  /** The name of the API method. */
  command: string
  /** The API version to use. If omitted, use version 1. */
  api_version?: number
}

interface Warning {
  id: number
  message: string
  details?: { [key: string]: string }
}

/**
 * This information is added to Transactions in request responses, but is not part
 * of the canonical Transaction information on ledger. These fields are denoted with
 * lowercase letters to indicate this in the rippled responses.
 */
export interface ResponseOnlyTxInfo {
  /**
   * The date/time when this transaction was included in a validated ledger.
   */
  date?: number
  /**
   * An identifying hash value unique to this transaction, as a hex string.
   */
  hash?: string
  /**
   * The sequence number of the ledger that included this transaction.
   */
  ledger_index?: number
}

export interface BaseResponse {
  id: number | string
  status?: 'success' | string
  type: 'response' | string
  result: unknown
  warning?: 'load'
  warnings?: Warning[]
  forwarded?: boolean
  api_version?: number
}

/**
 * The shape of an error response from rippled. xrpl.js handles rejections by
 * throwing, and allowing the user to handle in the catch block of a promise.
 *
 * @category Responses
 */
export interface ErrorResponse {
  id: number | string
  status: 'error'
  type: 'response' | string
  error: string
  error_code?: string
  error_message?: string
  request: Request
  api_version?: number
}
