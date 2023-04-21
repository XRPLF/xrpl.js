import { LedgerIndex, NFToken } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `nft_info` method retrieves information about NFToken
 * NFToken.
 *
 * @category Requests
 */
export interface NFTInfoRequest extends BaseRequest {
  command: 'nft_info'
  /**
   * The unique identifier of an NFToken.
   */
  nft_id: string
  /** A 20-byte hex string for the ledger version to use. */
  ledger_hash?: string
  /**
   * The ledger index of the ledger to use, or a shortcut string to choose a
   * ledger automatically.
   */
  ledger_index?: LedgerIndex
}

/**
 * Response expected from an {@link NFTInfoResponse}.
 *
 * @category Responses
 */
export interface NFTInfoResponse extends BaseResponse {
  result: NFToken
}
