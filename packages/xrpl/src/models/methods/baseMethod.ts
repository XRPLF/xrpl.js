import { LedgerIndex } from '../common'

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

export interface LookupByLedgerRequest {
  /** A 20-byte hex string for the ledger version to use. */
  ledger_hash?: string
  /** The ledger index of the ledger to use, or a shortcut string. */
  ledger_index?: LedgerIndex
}

export interface ResponseWarning {
  id: number
  message: string
  details?: { [key: string]: string }
}

export interface BaseResponse {
  id: number | string
  status?: 'success' | string
  type: 'response' | string
  result: unknown
  warning?: 'load'
  warnings?: ResponseWarning[]
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
  error_exception?: string
  request: Request
  api_version?: number
}
