/* eslint-disable valid-jsdoc */
'use strict';

/**
 * Base class for all errors
 */
function RippleError(message) {
  this.message = message;
}
RippleError.prototype = new Error();
RippleError.prototype.name = 'RippleError';

/**
 * Invalid Request Error
 * Missing parameters or invalid parameters
 */
function InvalidRequestError(message) {
  this.message = message;
}
InvalidRequestError.prototype = new RippleError();
InvalidRequestError.prototype.name = 'InvalidRequestError';
InvalidRequestError.prototype.error = 'restINVALID_PARAMETER';

/**
 * Network Error
 * Timeout, disconnects and too busy
 */
function NetworkError(message) {
  this.message = message;
}
NetworkError.prototype = new RippleError();
NetworkError.prototype.name = 'NetworkError';

/**
 * Rippled NetworkError
 * Failed transactions, no paths found, not enough balance, etc.
 */
function RippledNetworkError(message) {
  this.message = message !== undefined ? message : 'Cannot connect to rippled';
}
RippledNetworkError.prototype = new NetworkError();
RippledNetworkError.prototype.error = 'restRIPPLED_NETWORK_ERR';

/**
 * Transaction Error
 * Failed transactions, no paths found, not enough balance, etc.
 */
function TransactionError(message) {
  this.message = message;
}
TransactionError.prototype = new RippleError();
TransactionError.prototype.name = 'TransactionError';

/**
 * Not Found Error
 * Asset could not be found
 */
function NotFoundError(message) {
  this.message = message;
}
NotFoundError.prototype = new RippleError();
NotFoundError.prototype.name = 'NotFoundError';
NotFoundError.prototype.error = 'restNOT_FOUND';

/**
 * Time Out Error
 * Request timed out
 */
function TimeOutError(message) {
  this.message = message;
}
TimeOutError.prototype = new RippleError();
TimeOutError.prototype.name = 'TimeOutError';

/**
 * API Error
 * API logic failed to do what it intended
 */
function ApiError(message) {
  this.message = message;
}
ApiError.prototype = new RippleError();
ApiError.prototype.name = 'ApiError';

module.exports = {
  InvalidRequestError: InvalidRequestError,
  NetworkError: NetworkError,
  TransactionError: TransactionError,
  RippledNetworkError: RippledNetworkError,
  NotFoundError: NotFoundError,
  TimeOutError: TimeOutError,
  ApiError: ApiError,
  RippleError: RippleError
};
