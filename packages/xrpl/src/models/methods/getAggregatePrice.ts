import { BaseRequest, BaseResponse } from './baseMethod'

export interface Oracle {
  account: string
  oracle_document_id: number
}

/**
 * The `get_aggregate_price` method retrieves the aggregate price of specified Oracle objects,
 * returning three price statistics: mean, median, and trimmed mean.
 * Returns an {@link GetAggregatePriceResponse}.
 *
 * @category Requests
 */
export interface GetAggregatePriceRequest extends BaseRequest {
  command: 'get_aggregate_price'

  base_asset: string

  quote_asset: string

  oracles: Oracle[]

  trim?: number

  trim_threshold?: number
}

/**
 * Response expected from an {@link GetAggregatePriceRequest}.
 *
 * @category Responses
 */
export interface GetAggregatePriceResponse extends BaseResponse {
  result: {
    entire_set: {
      mean: string
      size: number
      standard_deviation: string
    }

    trimmed_set: {
      mean: string
      size: number
      standard_deviation: string
    }

    time: number

    /**
     * The identifying hash of the ledger that was used to generate this
     * response.
     */
    ledger_hash?: string

    /**
     * The ledger index of the ledger version that was used to generate this
     * response.
     */
    ledger_index?: number

    /**
     * If included and set to true, the information in this response comes from
     * a validated ledger version. Otherwise, the information is subject to
     * change.
     */
    validated?: boolean
  }
}
