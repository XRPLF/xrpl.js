import { NFToken } from '../common'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * The `nft_info` method retrieves information about an NFToken.
 *
 * @category Requests
 */
export interface NFTInfoRequest extends BaseRequest, LookupByLedgerRequest {
  command: 'nft_info'
  /**
   * The unique identifier of an NFToken.
   */
  nft_id: string
}

/**
 * Response expected from an {@link NFTInfoResponse}.
 *
 * @category Responses
 */
export interface NFTInfoResponse extends BaseResponse {
  result: NFToken
}
