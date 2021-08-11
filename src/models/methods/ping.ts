import { BaseRequest, BaseResponse } from "./baseMethod";

export interface PingRequest extends BaseRequest {
  command: "ping"
}

export interface PingResponse extends BaseResponse {
  result: {}
}
