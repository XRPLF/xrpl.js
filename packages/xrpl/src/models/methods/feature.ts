import { BaseRequest, BaseResponse } from './baseMethod'

export interface FeatureAllRequest extends BaseRequest {
  command: 'feature'

  feature?: never
}

export interface FeatureOneRequest extends BaseRequest {
  command: 'feature'

  feature: string
}

/**
 * The `feature` command returns information about amendments this server knows about, including whether they are enabled.
 * Returns an {@link FeatureResponse}.
 *
 * @category Requests
 */
export type FeatureRequest = FeatureAllRequest | FeatureOneRequest

export interface FeatureAllResponse extends BaseResponse {
  result: {
    features: Record<
      string,
      {
        /*
         * Whether this amendment is currently enabled in the latest ledger.
         */
        enabled: boolean

        /*
         * The human-readable name for this amendment, if known.
         */
        name: string

        supported: boolean
      }
    >
  }
}

export interface FeatureOneResponse extends BaseResponse {
  result: Record<
    string,
    {
      /*
       * Whether this amendment is currently enabled in the latest ledger.
       */
      enabled: boolean

      /*
       * The human-readable name for this amendment, if known.
       */
      name: string

      supported: boolean
    }
  >
}

/**
 * Response expected from an {@link FeatureRequest}.
 *
 * @category Responses
 */
export type FeatureResponse = FeatureAllResponse | FeatureOneResponse
