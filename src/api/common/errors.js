/* eslint-disable valid-jsdoc */
'use strict';

const util = require('util');
const utils = require('./utils');

/**
 * Base class for all errors
 */
function RippleError(message) {
  this.message = message;
}

RippleError.prototype = Object.create(Error.prototype);
RippleError.prototype.name = 'RippleError';


RippleError.prototype.toString = function() {
  let result = '[' + this.name + '(' + this.message;
  if (this.data) {
    result += ', ' + util.inspect(this.data);
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

class RippledError extends RippleError {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    Error.captureStackTrace(this, this.constructor.name);
  }
}

class ConnectionError extends RippleError {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    Error.captureStackTrace(this, this.constructor.name);
  }
}

class NotConnectedError extends ConnectionError {
  constructor(message) {
    super(message);
  }
}

class DisconnectedError extends ConnectionError {
  constructor(message) {
    super(message);
  }
}

class TimeoutError extends ConnectionError {
  constructor(message) {
    super(message);
  }
}

class UnexpectedError extends ConnectionError {
  constructor(message) {
    super(message);
  }
}

function ValidationError(message) {
  this.message = message;
}
ValidationError.prototype = new RippleError();
ValidationError.prototype.name = 'ValidationError';

/**
 * Timeout, disconnects and too busy
 */
function NetworkError(message) {
  this.message = message;
}
NetworkError.prototype = new RippleError();
NetworkError.prototype.name = 'NetworkError';

/**
 * Failed transactions, no paths found, not enough balance, etc.
 */
function RippledNetworkError(message) {
  this.message = message !== undefined ? message : 'Cannot connect to rippled';
}
RippledNetworkError.prototype = new NetworkError();

/**
 * Failed transactions, no paths found, not enough balance, etc.
 */
function TransactionError(message) {
  this.message = message;
}
TransactionError.prototype = new RippleError();
TransactionError.prototype.name = 'TransactionError';

/**
 * Asset could not be found
 */
function NotFoundError(message) {
  this.message = message;
}
NotFoundError.prototype = new RippleError();
NotFoundError.prototype.name = 'NotFoundError';

function MissingLedgerHistoryError(message) {
  this.message = message ||
    'Server is missing ledger history in the specified range';
}
MissingLedgerHistoryError.prototype = new RippleError();
MissingLedgerHistoryError.prototype.name = 'MissingLedgerHistoryError';

function PendingLedgerVersionError(message) {
  this.message = message ||
    'maxLedgerVersion is greater than server\'s most recent validated ledger';
}
PendingLedgerVersionError.prototype = new RippleError();
PendingLedgerVersionError.prototype.name = 'PendingLedgerVersionError';

/**
 * Request timed out
 */
function TimeOutError(message) {
  this.message = message;
}
TimeOutError.prototype = new RippleError();
TimeOutError.prototype.name = 'TimeOutError';

/**
 * API logic failed to do what it intended
 */
function ApiError(message) {
  this.message = message;
}
ApiError.prototype = new RippleError();
ApiError.prototype.name = 'ApiError';

module.exports = {
  ValidationError,
  NetworkError,
  TransactionError,
  RippledNetworkError,
  NotFoundError,
  PendingLedgerVersionError,
  MissingLedgerHistoryError,
  TimeOutError,
  ApiError,
  RippleError,
  ConnectionError,
  RippledError,
  NotConnectedError,
  DisconnectedError,
  TimeoutError,
  UnexpectedError
};
