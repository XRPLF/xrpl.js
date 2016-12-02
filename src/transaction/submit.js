/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const utils = require('./utils')
const {validate} = utils.common
import type {Submit} from './types.js'

function isImmediateRejection(engineResult: string): boolean {
  // note: "tel" errors mean the local server refused to process the
  // transaction *at that time*, but it could potentially buffer the
  // transaction and then process it at a later time, for example
  // if the required fee changes (this does not occur at the time of
  // this writing, but it could change in the future)
  // all other error classes can potentially result in transcation validation
  return _.startsWith(engineResult, 'tem')
}

function formatSubmitResponse(response) {
  const data = {
    resultCode: response.engine_result,
    resultMessage: response.engine_result_message
  }
  if (isImmediateRejection(response.engine_result)) {
    throw new utils.common.errors.RippledError('Submit failed', data)
  }
  return data
}

function submit(signedTransaction: string): Promise<Submit> {
  validate.submit({signedTransaction})

  const request = {
    command: 'submit',
    tx_blob: signedTransaction
  }
  return this.connection.request(request).then(formatSubmitResponse)
}

module.exports = submit
