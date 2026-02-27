import { NFTOffer } from '../common'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * The `nft_sell_offers` method retrieves all of sell offers for the specified
 * NFToken.
 *
 * @category Requests
 */
export interface NFTSellOffersRequest
  extends BaseRequest,
    LookupByLedgerRequest {
  command: 'nft_sell_offers'
  /**
   * The unique identifier of an NFToken. The request returns sell offers for this NFToken.
   */
  nft_id: string
  /**
   * Limit the number of NFT sell offers to retrieve. The server may return
   * fewer results. Valid values are within 50-500. The default is 250.
   */
  limit?: number
  /**
   * Value from a previous paginated response. Resume retrieving data where
   * that response left off.
   */
  marker?: unknown
}

/**
 * Response expected from an {@link NFTSellOffersRequest}.
 *
 * @category Responses
 */
export interface NFTSellOffersResponse extends BaseResponse {
  result: {
    /**
     * A list of sell offers for the specified NFToken.
     */
    offers: NFTOffer[]
    /**
     * The token ID of the NFToken to which these offers pertain.
     */
    nft_id: string
    /**
     * The limit value used in the request.
     */
    limit?: number
    /**
     * Server-defined value indicating the response is paginated. Pass this to
     * the next call to resume where this call left off.
     */
    marker?: unknown
  }
}
