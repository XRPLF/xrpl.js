/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;
const Request = utils.common.core.Request;

function submit(tx_blob: string,
    callback: (err: any, data: any) => void): void {
  validate.blob(tx_blob);
  const request = new Request(this.remote, 'submit');
  request.message.tx_blob = tx_blob;
  request.request(null, callback);
}

module.exports = submit;
