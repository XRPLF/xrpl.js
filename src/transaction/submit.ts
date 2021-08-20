// Deprecated - use client.request instead:
//   const response = await client.request({
//     command: 'submit',
//     tx_blob: signedTransaction,
//     fail_hard: failHard
//   });

import * as utils from './utils'
import {validate} from '../common'
import {Client} from '..'

export interface FormattedSubmitResponse {
  resultCode: string
  resultMessage: string
}

function isImmediateRejection(engineResult: string): boolean {
  // note: "tel" errors mean the local server refused to process the
  // transaction *at that time*, but it could potentially buffer the
  // transaction and then process it at a later time, for example
  // if the required fee changes (this does not occur at the time of
  // this writing, but it could change in the future)
  // all other error classes can potentially result in transaction validation
  return engineResult.startsWith('tem')
}

function formatSubmitResponse(response): FormattedSubmitResponse {
  const data = {
    // @deprecated
    resultCode: response.engine_result,
    // @deprecated
    resultMessage: response.engine_result_message,
    engine_result: response.engine_result,
    engine_result_code: response.engine_result_code,
    engine_result_message: response.engine_result_message,
    tx_blob: response.tx_blob,
    tx_json: response.tx_json
  }
  if (isImmediateRejection(response.engine_result)) {
    throw new utils.common.errors.RippledError('Submit failed', data)
  }
  return data
}

// @deprecated Use client.request({ command: 'submit' tx_blob: signedTransaction }) instead
async function submit(
  this: Client,
  signedTransaction: string,
  failHard?: boolean
): Promise<FormattedSubmitResponse> {
  // 1. Validate
  validate.submit({signedTransaction})
  // 2. Make Request
  const response = await this.request({command: 'submit',
    tx_blob: signedTransaction,
    ...(failHard ? {fail_hard: failHard} : {})
  })
  // 3. Return Formatted Response
  return formatSubmitResponse(response.result)
}

export default submit
