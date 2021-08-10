import {BaseRequest, BaseResponse} from './baseMethod'

export interface ChannelVerifyRequest extends BaseRequest {
  command: 'channel_verify'
  channel_id: string
  amount: string
  public_key?: string
  signature: string
}

export interface ChannelVerifyResponse extends BaseResponse {
  result: {
    signature_verified: boolean
  }
}
