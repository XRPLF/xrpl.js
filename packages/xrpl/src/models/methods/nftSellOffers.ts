import { Amount } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `nft_sell_offers` method retrieves all of sell offers for the specified
 * NFToken.
 *
 * @category Requests
 */
export interface NFTSellOffersRequest extends BaseRequest {
  command: 'nft_sell_offers'
  /**
   * The unique identifier of an NFToken. The request returns sell offers for this NFToken.
   */
  tokenid: string
}

/**
 * One sell offer that might be returned from an {@link NFTSellOffersRequest}.
 *
 * @category Responses
 */
interface NFTSellOffer {
  // TODO Need to check all this
  amount: Amount
  destination: string
  expiration: number
  flags: number
  index: string
  owner: string
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
    offers: NFTSellOffer[]
    /**
     * The token ID of the NFToken to which these offers pertain.
     */
    tokenid: string
  }
}
