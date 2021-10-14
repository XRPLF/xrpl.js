import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `channel_verify` method checks the validity of a signature that can be
 * used to redeem a specific amount of XRP from a payment channel. Expects a
 * response in the form of a {@link ChannelVerifyResponse}.
 *
 * @category Requests
 */
export interface ChannelVerifyRequest extends BaseRequest {
  command: 'channel_verify'
  /** The amount of XRP, in drops, the provided signature authorizes. */
  amount: string
  /**
   * The Channel ID of the channel that provides the XRP. This is a
   * 64-character hexadecimal string.
   */
  channel_id: string
  /**
   * The public key of the channel and the key pair that was used to create the
   * signature, in hexadecimal or the XRP Ledger's base58 format.
   */
  public_key: string
  /** The signature to verify, in hexadecimal. */
  signature: string
}

/**
 * Response expected from an {@link ChannelVerifyRequest}.
 *
 * @category Responses
 */
export interface ChannelVerifyResponse extends BaseResponse {
  result: {
    /**
     * If true, the signature is valid for the stated amount, channel, and
     * public key.
     */
    signature_verified: boolean
  }
}
