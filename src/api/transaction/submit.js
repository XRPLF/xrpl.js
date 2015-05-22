'use strict';
const utils = require('./utils');
const ripple = utils.common.core;
const validate = utils.common.validate;

function submit(tx_blob, callback) {
  validate.blob(tx_blob);
  const request = new ripple.Request(this.remote, 'submit');
  request.message.tx_blob = tx_blob;
  request.request(callback);
}

module.exports = submit;
