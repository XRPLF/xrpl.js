import type { BaseRequest, BaseResponse } from './baseMethod'

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
  result: { role?: string; unlimited?: boolean }
}
