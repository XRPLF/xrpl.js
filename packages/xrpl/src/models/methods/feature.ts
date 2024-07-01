import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `feature` command returns information about amendments this server knows about, including whether they are enabled.
 * Returns an {@link FeatureResponse}.
 *
 * @category Requests
 */
export interface FeatureRequest extends BaseRequest {
  command: 'feature'

  feature?: string
}

/**
 * Response expected from an {@link FeatureRequest}.
 *
 * @category Responses
 */
export interface FeatureResponse extends BaseResponse {
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
