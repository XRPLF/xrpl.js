import * as _ from 'lodash'
import * as utils from './utils'
import {validate} from '../common'
import {RippleAPI} from '..'

export interface FormattedSubmitResponse {
  resultCode: string,
  resultMessage: string
}

function isImmediateRejection(engineResult: string): boolean {
  // note: "tel" errors mean the local server refused to process the
  // transaction *at that time*, but it could potentially buffer the
  // transaction and then process it at a later time, for example
  // if the required fee changes (this does not occur at the time of
  // this writing, but it could change in the future)
  // all other error classes can potentially result in transaction validation
  return _.startsWith(engineResult, 'tem')
}

function formatSubmitResponse(response): FormattedSubmitResponse {
  const data = {
    resultCode: response.engine_result,
    resultMessage: response.engine_result_message
  }
  if (isImmediateRejection(response.engine_result)) {
    throw new utils.common.errors.RippledError('Submit failed', data)
  }
  return data
}

async function submit(
  this: RippleAPI, signedTransaction: string
): Promise<FormattedSubmitResponse> {
  // 1. Validate
  validate.submit({signedTransaction})
  // 2. Make Request
  const response = await this.request('submit', {tx_blob: signedTransaction})
  // 3. Return Formatted Response
  return formatSubmitResponse(response)
}

export default submit
