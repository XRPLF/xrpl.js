import { BaseRequest, BaseResponse } from "./baseMethod";

export interface ChannelVerifyRequest extends BaseRequest {
  command: "channel_verify";
  amount: string;
  channel_id: string;
  public_key: string;
  signature: string;
}

export interface ChannelVerifyResponse extends BaseResponse {
  result: {
    signature_verified: boolean;
  };
}
