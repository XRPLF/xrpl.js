/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
const Request = utils.common.core.Request;
const convertErrors = utils.common.convertErrors;

function isImmediateRejection(engineResult) {
  return _.startsWith(engineResult, 'tel')
      || _.startsWith(engineResult, 'tem')
      || _.startsWith(engineResult, 'tej');
}

function convertSubmitErrors(callback) {
  return function(error, data) {
    if (isImmediateRejection(data.engineResult)) {
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

function submit(txBlob: string) {
  return utils.promisify(submitAsync.bind(this))(txBlob);
}

module.exports = submit;
