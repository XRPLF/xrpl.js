/* eslint-disable valid-jsdoc */
'use strict';

const _ = require('lodash');
const async = require('async');
const asyncify = require('simple-asyncify');
const bignum = require('bignumber.js');
const transactions = require('./transactions');
const TxToRestConverter = require('./tx-to-rest-converter.js');
const utils = require('./utils');
const validate = utils.common.validate;

const ValidationError = utils.common.errors.ValidationError;
const NotFoundError = utils.common.errors.NotFoundError;
const TimeOutError = utils.common.errors.TimeOutError;

const DEFAULT_RESULTS_PER_PAGE = 10;

/**
 * Formats a transaction into ripple-rest Payment format
 *
 * @param {RippleAddress} account
 * @param {Transaction} transaction
 * @param {Function} callback
 *
 * @callback
 * @param {Error} error
 * @param {RippleRestTransaction} transaction
 */
function formatPaymentHelper(account, txJSON) {
  if (!(txJSON && /^payment$/i.test(txJSON.TransactionType))) {
    throw new ValidationError('Not a payment. The transaction '
      + 'corresponding to the given identifier is not a payment.');
  }
  const metadata = {
    hash: txJSON.hash || '',
    ledger: String(!_.isUndefined(txJSON.inLedger) ?
      txJSON.inLedger : txJSON.ledger_index),
    state: txJSON.validated === true ? 'validated' : 'pending'
  };
  const message = {tx_json: txJSON};
  const meta = txJSON.meta;
  const parsed = TxToRestConverter.parsePaymentFromTx(account, message, meta);
  return _.assign({payment: parsed.payment}, metadata);
}

/**
 * Retrieve the details of a particular payment from the Remote
 * and return it in the ripple-rest Payment format.
 *
 * @param {Remote} remote
 * @param {RippleAddress} req.params.account
 * @param {Hex-encoded String|ASCII printable character String}
 *            req.params.identifier
 */
function getPayment(account, identifier, callback) {
  const self = this;

  validate.address(account);
  validate.identifier(identifier);

  function getTransaction(_callback) {
    transactions.getTransaction(self, account, identifier, {}, _callback);
  }

  const steps = [
    getTransaction,
    asyncify(_.partial(formatPaymentHelper, account))
  ];

  async.waterfall(steps, callback);
}

/**
 * Retrieve the details of multiple payments from the Remote
 *
 * This function calls transactions.getAccountTransactions
 * recursively to retrieve results_per_page number of transactions
 * and filters the results by type "payment", along with the other
 * client-specified parameters.
 *
 * @param {Remote} remote
 * @param {RippleAddress} req.params.account
 * @param {RippleAddress} req.query.source_account
 * @param {RippleAddress} req.query.destination_account
 * @param {String "incoming"|"outgoing"} req.query.direction
 * @param {Number} [-1] req.query.start_ledger
 * @param {Number} [-1] req.query.end_ledger
 * @param {Boolean} [false] req.query.earliest_first
 * @param {Boolean} [false] req.query.exclude_failed
 * @param {Number} [20] req.query.results_per_page
 * @param {Number} [1] req.query.page
 */
function getAccountPayments(account, source_account, destination_account,
    direction, options, callback) {
  const self = this;

  function getTransactions(_callback) {
    const args = {
      account: account,
      source_account: source_account,
      destination_account: destination_account,
      direction: direction,
      min: options.results_per_page,
      max: options.results_per_page,
      offset: (options.results_per_page || DEFAULT_RESULTS_PER_PAGE)
              * ((options.page || 1) - 1),
      types: ['payment'],
      earliestFirst: options.earliest_first
    };

    transactions.getAccountTransactions(self,
      _.merge(options, args), _callback);
  }

  function formatTransactions(_transactions) {
    return _transactions.map(_.partial(formatPaymentHelper, account));
  }

  function formatResponse(_transactions) {
    return {payments: _transactions};
  }

  const steps = [
    getTransactions,
    _.partial(utils.attachDate, self),
    asyncify(formatTransactions),
    asyncify(formatResponse)
  ];

  async.waterfall(steps, callback);
}

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
      dst_amount: utils.common.convertAmount(pathfind.destination.amount)
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
      return TxToRestConverter.parsePaymentsFromPathFind(pathfindResults);
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

module.exports = {
  getPayment: getPayment,
  getAccountPayments: getAccountPayments,
  getPathFind: getPathFind
};
