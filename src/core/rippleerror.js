'use strict';

const util = require('util');
const utils = require('./utils');
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

  this.result =
    _.get(this, ['remote', 'error'], this.result);
  this.result_message =
    _.get(this, ['remote', 'error_message'], this.result_message);
  this.engine_result = this.result = (this.result || this.engine_result ||
    this.error || 'Error');
  this.engine_result_message = this.result_message = (this.result_message ||
    this.engine_result_message || this.error_message || this.result || 'Error');
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


RippleError.prototype.toString = function() {
  let result = '[RippleError(' + this.result;
  if (this.result_message && this.result_message !== this.result) {
    result += ', ' + this.result_message;
  }
  result += ')]';
  return result;
};

/*
  console.log in node uses util.inspect on object, and util.inspect allows
  to cutomize it output:
  https://nodejs.org/api/util.html#util_custom_inspect_function_on_objects
*/
RippleError.prototype.inspect = function(depth) {
  utils.unused(depth);
  return this.toString();
};


exports.RippleError = RippleError;
