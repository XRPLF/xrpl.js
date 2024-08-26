import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `get_aggregate_price` method retrieves the aggregate price of specified Oracle objects,
 * returning three price statistics: mean, median, and trimmed mean.
 * Returns an {@link GetAggregatePriceResponse}.
 *
 * @category Requests
 */
export interface GetAggregatePriceRequest extends BaseRequest {
  command: 'get_aggregate_price'

  /**
   * The currency code of the asset to be priced.
   */
  base_asset: string

  /**
   * The currency code of the asset to quote the price of the base asset.
   */
  quote_asset: string

  /**
   * The oracle identifier.
   */
  oracles: Array<{
    /**
     * The XRPL account that controls the Oracle object.
     */
    account: string

    /**
     * A unique identifier of the price oracle for the Account
     */
    oracle_document_id: string | number
  }>

  /**
   * The percentage of outliers to trim. Valid trim range is 1-25. If included, the API returns statistics for the trimmed mean.
   */
  trim?: number

  /**
   * Defines a time range in seconds for filtering out older price data. Default value is 0, which doesn't filter any data.
   */
  trim_threshold?: number
}

/**
 * Response expected from an {@link GetAggregatePriceRequest}.
 *
 * @category Responses
 */
export interface GetAggregatePriceResponse extends BaseResponse {
  result: {
    /**
     * The statistics from the collected oracle prices.
     */
    entire_set: {
      /**
       * The simple mean.
       */
      mean: string

      /**
       * The size of the data set to calculate the mean.
       */
      size: number

      /**
       * The standard deviation.
       */
      standard_deviation: string
    }

    /**
     * The trimmed statistics from the collected oracle prices. Only appears if the trim field was specified in the request.
     */
    trimmed_set?: {
      /**
       * The simple mean of the trimmed data.
       */
      mean: string

      /**
       * The size of the data to calculate the trimmed mean.
       */
      size: number

      /**
       * The standard deviation of the trimmed data.
       */
      standard_deviation: string
    }

    /**
     * The median of the collected oracle prices.
     */
    median: string

    /**
     * The most recent timestamp out of all LastUpdateTime values.
     */
    time: number

    /**
     * The ledger index of the ledger version that was used to generate this
     * response.
     */
    ledger_current_index: number

    /**
     * If included and set to true, the information in this response comes from
     * a validated ledger version. Otherwise, the information is subject to
     * change.
     */
    validated: boolean
  }
}
