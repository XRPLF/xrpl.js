import { NFTOffer } from '../common'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * The `nft_buy_offers` method retrieves all of buy offers for the specified
 * NFToken.
 *
 * @category Requests
 */
export interface NFTBuyOffersRequest
  extends BaseRequest,
    LookupByLedgerRequest {
  command: 'nft_buy_offers'
  /**
   * The unique identifier of an NFToken. The request returns buy offers for this NFToken.
   */
  nft_id: string
  /**
   * Limit the number of NFT buy offers to retrieve. The server may return
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
 * Response expected from an {@link NFTBuyOffersRequest}.
 *
 * @category Responses
 */
export interface NFTBuyOffersResponse extends BaseResponse {
  result: {
    /**
     * A list of buy offers for the specified NFToken.
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
