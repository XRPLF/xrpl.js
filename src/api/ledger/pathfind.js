/* eslint-disable valid-jsdoc */
'use strict';
const async = require('async');
const asyncify = require('simple-asyncify');
const bignum = require('bignumber.js');
const utils = require('./utils');
const validate = utils.common.validate;
const parsePathfind = require('./parse/pathfind');
const NotFoundError = utils.common.errors.NotFoundError;
const TimeOutError = utils.common.errors.TimeOutError;

/**
 * Get a ripple path find, a.k.a. payment options,
 * for a given set of parameters and respond to the
 * client with an array of fully-formed Payments.
 *
 * @param {Remote} remote
 * @param {RippleAddress} req.params.source_account
 * @param {Amount Array ["USD r...,XRP,..."]} req.query.source_currencies
 *          - Note that Express.js middleware replaces "+" signs with spaces.
 *            Clients should use "+" signs but the values here will end up
 *            as spaces
 * @param {RippleAddress} req.params.destination_account
 * @param {Amount "1+USD+r..."} req.params.destination_amount_string
 */
function getPathFind(pathfind, callback) {
  const self = this;
  validate.pathfind(pathfind);

  function prepareOptions() {
    const pathfindParams = {
      src_account: pathfind.source.address,
      dst_account: pathfind.destination.address,
      dst_amount: utils.common.toRippledAmount(pathfind.destination.amount)
    };
    if (typeof pathfindParams.dst_amount === 'object'
          && !pathfindParams.dst_amount.issuer) {
      // Convert blank issuer to sender's address
      // (Ripple convention for 'any issuer')
      // https://ripple.com/build/transactions/
      //     #special-issuer-values-for-sendmax-and-amount
      // https://ripple.com/build/ripple-rest/#counterparties-in-payments
      pathfindParams.dst_amount.issuer = pathfindParams.dst_account;
    }
    if (pathfind.source.amounts && pathfind.source.amounts.length > 0) {
      pathfindParams.src_currencies = pathfind.source.amounts;
    }
    return pathfindParams;
  }

  function findPath(pathfindParams, _callback) {
    const request = self.remote.requestRipplePathFind(pathfindParams);
    request.once('error', _callback);
    request.once('success', function(pathfindResults) {
      pathfindResults.source_account = pathfindParams.src_account;
      pathfindResults.source_currencies = pathfindParams.src_currencies;
      pathfindResults.destination_amount = pathfindParams.dst_amount;
      _callback(null, pathfindResults);
    });

    function reconnectRippled() {
      self.remote.disconnect(function() {
        self.remote.connect();
      });
    }
    request.timeout(utils.common.server.CONNECTION_TIMEOUT, function() {
      request.removeAllListeners();
      reconnectRippled();
      _callback(new TimeOutError('Path request timeout'));
    });
    request.request();
  }

  function addDirectXrpPath(pathfindResults, _callback) {
    // Check if destination_amount is XRP and if destination_account accepts XRP
    if (typeof pathfindResults.destination_amount.currency === 'string'
          || pathfindResults.destination_currencies.indexOf('XRP') === -1) {
      return _callback(null, pathfindResults);
    }
    // Check source_account balance
    self.remote.requestAccountInfo({account: pathfindResults.source_account},
        function(error, result) {
      if (error) {
        return _callback(new Error(
          'Cannot get account info for source_account. ' + error));
      }
      if (!result || !result.account_data || !result.account_data.Balance) {
        return _callback(new Error('Internal Error. Malformed account info : '
                                  + JSON.stringify(result)));
      }
      // Add XRP "path" only if the source_account has enough money
      // to execute the payment
      if (bignum(result.account_data.Balance).greaterThan(
                                      pathfindResults.destination_amount)) {
        pathfindResults.alternatives.unshift({
          paths_canonical: [],
          paths_computed: [],
          source_amount: pathfindResults.destination_amount
        });
      }
      _callback(null, pathfindResults);
    });
  }

  function formatPath(pathfindResults) {
    const alternatives = pathfindResults.alternatives;
    if (alternatives && alternatives.length > 0) {
      return parsePathfind(pathfindResults);
    }
    if (pathfindResults.destination_currencies.indexOf(
            pathfind.destination.amount.currency) === -1) {
      throw new NotFoundError('No paths found. ' +
        'The destination_account does not accept ' +
        pathfind.destination.amount.currency +
        ', they only accept: ' +
        pathfindResults.destination_currencies.join(', '));
    } else if (pathfindResults.source_currencies
               && pathfindResults.source_currencies.length > 0) {
      throw new NotFoundError('No paths found. Please ensure' +
        ' that the source_account has sufficient funds to execute' +
        ' the payment in one of the specified source_currencies. If it does' +
        ' there may be insufficient liquidity in the network to execute' +
        ' this payment right now');
    } else {
      throw new NotFoundError('No paths found.' +
        ' Please ensure that the source_account has sufficient funds to' +
        ' execute the payment. If it does there may be insufficient liquidity' +
        ' in the network to execute this payment right now');
    }
  }

  function formatResponse(payments) {
    return {payments: payments};
  }

  const steps = [
    asyncify(prepareOptions),
    findPath,
    addDirectXrpPath,
    asyncify(formatPath),
    asyncify(formatResponse)
  ];

  async.waterfall(steps, callback);
}

module.exports = getPathFind;
