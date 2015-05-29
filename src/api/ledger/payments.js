/* eslint-disable valid-jsdoc */
'use strict';

const _ = require('lodash');
const async = require('async');
const asyncify = require('simple-asyncify');
const bignum = require('bignumber.js');
const transactions = require('./transactions');
const TxToRestConverter = require('./tx-to-rest-converter.js');
const utils = require('./utils');
const ripple = utils.common.core;
const validator = utils.common.schemaValidator;
const validate = utils.common.validate;

const InvalidRequestError = utils.common.errors.InvalidRequestError;
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
    throw new InvalidRequestError('Not a payment. The transaction '
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
  validate.paymentIdentifier(identifier);

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
function getPathFind(source_account, destination_account,
    destination_amount_string, source_currency_strings, callback) {
  const self = this;

  const destination_amount = utils.renameCounterpartyToIssuer(
    utils.parseCurrencyQuery(destination_amount_string || ''));

  validate.pathfind({
    source_account: source_account,
    destination_account: destination_account,
    destination_amount: destination_amount,
    source_currency_strings: source_currency_strings
  });

  const source_currencies = [];
  // Parse source currencies
  // Note that the source_currencies should be in the form
  // "USD r...,BTC,XRP". The issuer is optional but if provided should be
  // separated from the currency by a single space.
  if (source_currency_strings) {
    const sourceCurrencyStrings = source_currency_strings.split(',');
    for (let c = 0; c < sourceCurrencyStrings.length; c++) {
      // Remove leading and trailing spaces
      sourceCurrencyStrings[c] = sourceCurrencyStrings[c].replace(
                                                        /(^[ ])|([ ]$)/g, '');
      // If there is a space, there should be a valid issuer after the space
      if (/ /.test(sourceCurrencyStrings[c])) {
        const currencyIssuerArray = sourceCurrencyStrings[c].split(' ');
        const currencyObject = {
          currency: currencyIssuerArray[0],
          issuer: currencyIssuerArray[1]
        };
        if (validator.isValid(currencyObject.currency, 'Currency')
            && ripple.UInt160.is_valid(currencyObject.issuer)) {
          source_currencies.push(currencyObject);
        } else {
          callback(new InvalidRequestError('Invalid parameter: '
            + 'source_currencies. Must be a list of valid currencies'));
          return;
        }
      } else if (validator.isValid(sourceCurrencyStrings[c], 'Currency')) {
        source_currencies.push({currency: sourceCurrencyStrings[c]});
      } else {
        callback(new InvalidRequestError('Invalid parameter: '
          + 'source_currencies. Must be a list of valid currencies'));
        return;
      }
    }
  }

  function prepareOptions() {
    const pathfindParams = {
      src_account: source_account,
      dst_account: destination_account,
      dst_amount: utils.common.convertAmount(destination_amount)
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
    if (source_currencies.length > 0) {
      pathfindParams.src_currencies = source_currencies;
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
            destination_amount.currency) === -1) {
      throw new NotFoundError('No paths found. ' +
        'The destination_account does not accept ' +
        destination_amount.currency +
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
