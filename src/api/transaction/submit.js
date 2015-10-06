/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
const Request = utils.common.core.Request;
const convertErrors = utils.common.convertErrors;

type Submit = {
  success: boolean,
  engineResult: string,
  engineResultCode: number,
  engineResultMessage?: string,
  txBlob?: string,
  txJson?: Object
}

function isImmediateRejection(engineResult: string): boolean {
  // note: "tel" errors mean the local server refused to process the
  // transaction *at that time*, but it could potentially buffer the
  // transaction and then process it at a later time, for example
  // if the required fee changes (this does not occur at the time of
  // this writing, but it could change in the future)
  // all other error classes can potentially result in transcation validation
  return _.startsWith(engineResult, 'tem') || _.startsWith(engineResult, 'tej');
}

function convertSubmitErrors(callback) {
  return function(error, data) {
    if (!error && isImmediateRejection(data.engineResult)) {
      callback(new utils.common.errors.RippleError('Submit failed'), data);
    } else {
      callback(error, data);
    }
  };
}

function submitAsync(txBlob: string, callback: (err: any, data: any) => void
): void {
  validate.blob(txBlob);
  const request = new Request(this.remote, 'submit');
  request.message.tx_blob = txBlob;
  request.request(null,
    utils.common.composeAsync(
      data => utils.common.convertKeysFromSnakeCaseToCamelCase(data),
      convertSubmitErrors(convertErrors(callback))));
}

function submit(txBlob: string): Promise<Submit> {
  return utils.promisify(submitAsync.bind(this))(txBlob);
}

module.exports = submit;
