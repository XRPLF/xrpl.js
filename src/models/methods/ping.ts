import { BaseRequest, BaseResponse } from './baseMethod'

export interface PingRequest extends BaseRequest {
  command: 'ping'
}

export interface PingResponse extends BaseResponse {
  // TODO: figure out if there's a better way to type this
  // eslint-disable-next-line @typescript-eslint/ban-types -- actually should be an empty object
  result: {}
}
