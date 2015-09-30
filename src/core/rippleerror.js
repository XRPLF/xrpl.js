'use strict';

const util = require('util');
const _ = require('lodash');

function RippleError(code?: any, message?: string) {
  if (code instanceof Error) {
    this.result = code;
    this.result_message = code.message;
  } else {
    switch (typeof code) {
      case 'object':
        _.extend(this, code);
        break;

      case 'string':
        this.result = code;
        this.result_message = message;
        break;
    }
  }

  this.engine_result = this.result = (this.result || this.engine_result ||
    this.error || 'Error');
  this.engine_result_message = this.result_message = (this.result_message ||
    this.engine_result_message || this.error_message || 'Error');
  this.message = this.result_message;

  let stack;

  if (Boolean(Error.captureStackTrace)) {
    Error.captureStackTrace(this, code || this);
  } else {
    stack = new Error().stack;
    if (Boolean(stack)) {
      this.stack = stack;
    }
  }
}

util.inherits(RippleError, Error);

RippleError.prototype.name = 'RippleError';

exports.RippleError = RippleError;
