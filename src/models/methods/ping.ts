import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The ping command returns an acknowledgement, so that clients can test the
 * connection status and latency. Expects a response in the form of a {@link
 * PingResponse}.
 *
 * @category Requests
 */
export interface PingRequest extends BaseRequest {
  command: 'ping'
}

/**
 * Response expected from a {@link PingRequest}.
 *
 * @category Responses
 */
export interface PingResponse extends BaseResponse {
  // TODO: figure out if there's a better way to type this
  // eslint-disable-next-line @typescript-eslint/ban-types -- actually should be an empty object
  result: {}
}
