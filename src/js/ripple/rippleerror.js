var util   = require('util');
var extend = require('extend');

function RippleError(code, message) {
  if (typeof code === 'object') {
    extend(this, code);
  } else {
    this.result = code;
    this.result_message = message;
    this.message = message;
  }

  this.message = this.result_message || 'Error';

  Error.captureStackTrace(this, code || this);
}

util.inherits(RippleError, Error);

RippleError.prototype.name = 'RippleError';

exports.RippleError = RippleError;
