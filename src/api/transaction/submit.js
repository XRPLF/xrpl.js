/* @flow */
'use strict';
const utils = require('./utils');
const ripple = utils.common.core;
const validate = utils.common.validate;

/*:: type Callback = (err: any, data: any) => void */
function submit(tx_blob: string, callback: Callback): void {
  validate.blob(tx_blob);
  const request = new ripple.Request(this.remote, 'submit');
  request.message.tx_blob = tx_blob;
  request.request(null, callback);
}

module.exports = submit;
