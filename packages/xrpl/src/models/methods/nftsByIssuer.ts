import { NFToken } from '../common'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * The nfts_by_issuer method returns a list of NFTokens issued by the account.
 * The order of the NFTs is not associated with the date the NFTs were minted.
 * Expects a response in the form of a {@link
 * NFTsByIssuerResponse}.
 *
 * @category Requests
 */
export interface NFTsByIssuerRequest
  extends BaseRequest,
    LookupByLedgerRequest {
  command: 'nfts_by_issuer'
  /**
   * A unique identifier for the account, most commonly the account's address
   */
  issuer: string
  /**
   * Value from a previous paginated response. Resume retrieving data where
   * that response left off. This value is stable even if there is a change in
   * the server's range of available ledgers.
   */
  marker?: unknown
  /**
   * Filter NFTs issued by this issuer that have this taxon.
   */
  nft_taxon?: number
  /**
   * Default varies. Limit the number of transactions to retrieve. The server
   * is not required to honor this value.
   */
  limit?: number
}

/**
 * Expected response from an {@link NFTsByIssuerRequest}.
 *
 * @category Responses
 */
export interface NFTsByIssuerResponse extends BaseResponse {
  result: {
    /**
     * The unique identifier for the account, most commonly the account's address
     */
    issuer: string
    /**
     * A list of NFTs issued by the account.
     * The order of the NFTs is not associated with the date the NFTs were minted.
     */
    nfts: NFToken[]
    /**
     * Server-defined value indicating the response is paginated. Pass this
     * to the next call to resume where this call left off.
     */
    marker?: unknown
    /**
     * The limit value used in the request.
     */
    limit?: number
    /**
     * Use to filter NFTs issued by this issuer that have this taxon.
     */
    nft_taxon?: number
  }
}
