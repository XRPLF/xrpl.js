import { NFToken, LedgerIndex } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `nfts_by_issuer` method retreives all NFTokens issued by an account
 *
 * @category Requests
 */
export interface NFTsByIssuerRequest extends BaseRequest {
  command: 'nfts_by_issuer'
  /**
   * The unique identifier of an account, typically the account's address. The
   * request returns NFTs issued by this account.
   */
  issuer: string
  /**
   * The taxon of the NFTokens
   */
  nft_taxon?: number
  /** Use to look for transactions from a single ledger only. */
  ledger_hash?: string
  /** Use to look for transactions from a single ledger only. */
  ledger_index?: LedgerIndex
  /**
   * Limit the number of NFTokens to retrieve.
   */
  limit?: number
  /**
   * Value from a previous paginated response. Resume retrieving data where
   * that response left off.
   */
  marker?: unknown
}

/**
 * Response expected from an {@link NFTsByIssuerRequest}.
 *
 * @category Responses
 */
export interface NFTsByIssuerResponse extends BaseResponse {
  result: {
    /**
     * The unique identifier of an account, typically the account's address. The
     * response returns NFTs issued by this account.
     */
    issuer: string
    /**
     * A list of NFTokens
     */
    nfts: NFToken[]
    /**
     * Server-defined value indicating the response is paginated. Pass this
     * to the next call to resume where this call left off.
     */
    marker?: unknown
    /** The limit value used in the request. */
    limit?: number
    /**
     * The taxon as specified in the request
     */
    nft_taxon?: number
  }
}
