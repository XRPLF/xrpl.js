/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;
const Request = utils.common.core.Request;
const convertErrors = utils.common.convertErrors;

function submitAsync(txBlob: string, callback: (err: any, data: any) => void
): void {
  validate.blob(txBlob);
  const request = new Request(this.remote, 'submit');
  request.message.tx_blob = txBlob;
  request.request(null,
    utils.common.composeAsync(
      data => utils.common.convertKeysFromSnakeCaseToCamelCase(data),
      convertErrors(callback)));
}

function submit(txBlob: string) {
  return utils.promisify(submitAsync.bind(this))(txBlob);
}

module.exports = submit;
