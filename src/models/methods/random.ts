import { BaseRequest, BaseResponse } from './baseMethod'

/** The random command provides a random number to be used as a source of
 * entropy for random number generation by clients. Expects a response in the
 * form of a {@link RandomResponse}
 */
export interface RandomRequest extends BaseRequest {
  command: 'random'
}

/**
 * Response expected from a {@link RandomRequest}.
 */
export interface RandomResponse extends BaseResponse {
  result: {
    random: string
  }
}
