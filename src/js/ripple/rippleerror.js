var util   = require('util');
var extend = require('extend');

function RippleError(code, message) {
  if (typeof code === 'object') {
    extend(this, code);
  } else {
    this.result         = code;
    this.result_message = message;
  }

  this.result = this.result || this.error || 'Error';
  this.result_message = this.result_message || this.error_message || 'Error';
  this.message = this.result_message;

  Error.captureStackTrace(this, code || this);
}

util.inherits(RippleError, Error);

RippleError.prototype.name = 'RippleError';

exports.RippleError = RippleError;
