import { NFTOffer } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `nft_buy_offers` method retrieves all of buy offers for the specified
 * NFToken.
 *
 * @category Requests
 */
export interface NFTBuyOffersRequest extends BaseRequest {
  command: 'nft_buy_offers'
  /**
   * The unique identifier of an NFToken. The request returns buy offers for this NFToken.
   */
  tokenid: string
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
    tokenid: string
  }
}
