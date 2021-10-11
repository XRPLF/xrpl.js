import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `manifest` method reports the current "manifest" information for a given
 * validator public key. The "manifest" is the public portion of that
 * validator's configured token. Expects a response in the form of a {@link
 * ManifestResponse}.
 *
 * @example
 * ```ts
 * const manifest: ManifestRequest = {
 *  "command": "manifest",
 *  "public_key": "nHUFE9prPXPrHcG3SkwP1UzAQbSphqyQkQK9ATXLZsfkezhhda3p"
 * }
 * ```
 *
 * @category Requests
 */
export interface ManifestRequest extends BaseRequest {
  command: 'manifest'
  /**
   * The base58-encoded public key of the validator to look up. This can be the
   * master public key or ephemeral public key.
   */
  public_key: string
}

/**
 * Response expected from a {@link ManifestRequest}.
 *
 * @category Responses
 */
export interface ManifestResponse extends BaseResponse {
  result: {
    /**
     * The data contained in this manifest. Omitted if the server does not have
     *  A manifest for the public_key from the request.
     */
    details?: {
      domain: string
      ephemeral_key: string
      master_key: string
      seq: number
    }
    /**
     * The full manifest data in base64 format. This data is serialized to
     * binary before being base64-encoded. Omitted if the server does not have a
     * manifest for the public_key from the request.
     */
    manifest?: string
    /** The public_key from the request. */
    requested: string
  }
}
