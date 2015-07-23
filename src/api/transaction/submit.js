/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;
const Request = utils.common.core.Request;

function submit(txBlob: string, callback: (err: any, data: any) => void): void {
  validate.blob(txBlob);
  const request = new Request(this.remote, 'submit');
  request.message.tx_blob = txBlob;
  request.request(null, callback);
}

module.exports = submit;
