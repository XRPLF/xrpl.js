/* eslint-disable valid-jsdoc */
'use strict';
const _ = require('lodash');
const assert = require('assert');
const async = require('async');
const utils = require('./utils');
const validate = utils.common.validate;
const errors = utils.common.errors;

const DEFAULT_RESULTS_PER_PAGE = 10;

/**
 * Retrieve a transaction from the Remote based on the account and hash
 *
 * Note that if any errors are encountered while executing this function
 * they will be sent back to the client through the res. If the query is
 * successful it will be passed to the callback function
 *
 * @global
 * @param {Remote} remote
 *
 * @param {RippleAddress} account
 * @param {Hex-encoded String|ASCII printable character String} identifier
 * @param {Object} options
 * @param {Function} callback
 *
 * @callback
 * @param {Error} error
 * @param {Transaction} transaction
 */
function getTransaction(api, account, identifier, requestOptions, callback) {
  try {
    assert.strictEqual(typeof requestOptions, 'object');
    validate.address(account);
    validate.identifier(identifier);
    validate.options(requestOptions);
  } catch(err) {
    return callback(err);
  }

  const options = {};
  options.hash = identifier;

  const isLedgerRangeRequest = !_.isUndefined(requestOptions.min_ledger)
    && !_.isUndefined(requestOptions.max_ledger);

  if (isLedgerRangeRequest) {
    const minLedger = Number(options.min_ledger);
    const maxLedger = Number(options.max_ledger);
    for (let i = minLedger; i <= maxLedger; i++) {
      if (!api.remote.getServer().hasLedger(i)) {
        return callback(new errors.NotFoundError('Ledger not found'));
      }
    }
  }

  function queryTransaction(async_callback) {
    api.remote.requestTx({hash: options.hash}, async_callback);
  }

  function checkIfRelatedToAccount(transaction, async_callback) {
    if (options.account) {
      const transactionString = JSON.stringify(transaction);
      const account_regex = new RegExp(options.account);
      if (!account_regex.test(transactionString)) {
        return async_callback(new errors.InvalidRequestError(
          'Transaction specified did not affect the given account'));
      }
    }
    async_callback(null, transaction);
  }

  function attachDate(transaction, async_callback) {
    if (!transaction || transaction.date || !transaction.ledger_index) {
      return async_callback(null, transaction);
    }

    api.remote.requestLedger(transaction.ledger_index,
        function(error, ledgerRequest) {
      if (error) {
        return async_callback(new errors.NotFoundError(
          'Transaction ledger not found'));
      }

      if (typeof ledgerRequest.ledger.close_time === 'number') {
        transaction.date = ledgerRequest.ledger.close_time;
      }

      async_callback(null, transaction);
    });
  }

  const steps = [
    queryTransaction,
    checkIfRelatedToAccount,
    attachDate
  ];

  async.waterfall(steps, callback);
}

/**
 * Wrapper around the standard ripple-lib requestAccountTx function
 *
 * @param {Remote} remote
 * @param {RippleAddress} options.account
 * @param {Number} [-1] options.ledger_index_min
 * @param {Number} [-1] options.ledger_index_max
 * @param {Boolean} [false] options.earliestFirst
 * @param {Boolean} [false] options.binary
 * @param {opaque value} options.marker
 * @param {Function} callback
 *
 * @callback
 * @param {Error} error
 * @param {Array of transactions in JSON format} response.transactions
 * @param {opaque value} response.marker
 */
function getAccountTx(api, options, callback) {
  const params = {
    account: options.account,
    ledger_index_min: options.ledger_index_min || options.ledger_index || -1,
    ledger_index_max: options.ledger_index_max || options.ledger_index || -1,
    limit: options.limit || DEFAULT_RESULTS_PER_PAGE,
    forward: options.earliestFirst,
    marker: options.marker
  };
  if (options.binary) {
    params.binary = true;
  }
  api.remote.requestAccountTx(params, function(error, account_tx_results) {
    if (error) {
      return callback(error);
    }
    let transactions = [];
    account_tx_results.transactions.forEach(function(tx_entry) {
      if (!tx_entry.validated) {
        return;
      }
      const tx = tx_entry.tx;
      tx.meta = tx_entry.meta;
      tx.validated = tx_entry.validated;
      transactions.push(tx);
    });
    callback(null, {
      transactions: transactions,
      marker: account_tx_results.marker
    });
  });
}

/**
 * Filter transactions based on the given set of options.
 *
 * @param {Array of transactions in JSON format} transactions
 * @param {Boolean} [false] options.exclude_failed
 * @param {Array of Strings} options.types Possible values are "payment",
 *                      "offercreate", "offercancel", "trustset", "accountset"
 * @param {RippleAddress} options.source_account
 * @param {RippleAddress} options.destination_account
 * @param {String} options.direction Possible values are "incoming", "outgoing"
 *
 * @returns {Array of transactions in JSON format} filtered_transactions
 */
function transactionFilter(transactions, options) {
  const filtered_transactions = transactions.filter(function(transaction) {
    if (options.exclude_failed) {
      if (transaction.state === 'failed' || (transaction.meta
          && transaction.meta.TransactionResult !== 'tesSUCCESS')) {
        return false;
      }
    }
    if (options.types && options.types.length > 0) {
      if (options.types.indexOf(
          transaction.TransactionType.toLowerCase()) === -1) {
        return false;
      }
    }
    if (options.source_account) {
      if (transaction.Account !== options.source_account) {
        return false;
      }
    }
    if (options.destination_account) {
      if (transaction.Destination !== options.destination_account) {
        return false;
      }
    }
    if (options.direction) {
      if (options.direction === 'outgoing'
          && transaction.Account !== options.account) {
        return false;
      }
      if (options.direction === 'incoming' && transaction.Destination
          && transaction.Destination !== options.account) {
        return false;
      }
    }
    return true;
  });

  return filtered_transactions;
}

function getTransactionsHelper(api, options, callback) {
  getAccountTx(api, options, function(error, results) {
    if (error) {
      callback(error);
    } else {
      // Set marker so that when this function is called again
      // recursively it starts from the last place it left off
      options.marker = results.marker;
      callback(null, results.transactions);
    }
  });
}

/**
 * Recursively get transactions for the specified account from
 * the Remote. If options.min is set, this will
 * recurse until it has retrieved that number of transactions or
 * it has reached the end of the account's transaction history.
 *
 * @param {Remote} remote
 * @param {RippleAddress} options.account
 * @param {Number} [-1] options.ledger_index_min
 * @param {Number} [-1] options.ledger_index_max
 * @param {Boolean} [false] options.earliestFirst
 * @param {Boolean} [false] options.binary
 * @param {Boolean} [false] options.exclude_failed
 * @param {Number} [DEFAULT_RESULTS_PER_PAGE] options.min
 * @param {Number} [DEFAULT_RESULTS_PER_PAGE] options.max
 * @param {Array of Strings} options.types Possible values are "payment",
 *                       "offercreate", "offercancel", "trustset", "accountset"
 * @param {opaque value} options.marker
 * @param {Array of Transactions} options.previous_transactions
 *            Included automatically when this function is called recursively
 * @param {Express.js Response} res
 * @param {Function} callback
 *
 * @callback
 * @param {Error} error
 * @param {Array of transactions in JSON format} transactions
 */
function getAccountTransactions(api, options, callback) {
  try {
    validate.address(options.account);
  } catch(err) {
    return callback(err);
  }

  if (!options.min) {
    options.min = module.exports.DEFAULT_RESULTS_PER_PAGE;
  }
  if (!options.max) {
    options.max = Math.max(options.min,
      module.exports.DEFAULT_RESULTS_PER_PAGE);
  }
  if (!options.limit) {
    options.limit = module.exports.DEFAULT_LIMIT;
  }

  function queryTransactions(async_callback) {
    getTransactionsHelper(api, options, async_callback);
  }

  function filterTransactions(transactions, async_callback) {
    async_callback(null, transactionFilter(transactions, options));
  }

  function sortTransactions(transactions, async_callback) {
    const compare = options.earliestFirst ? utils.compareTransactions :
      _.rearg(utils.compareTransactions, 1, 0);
    transactions.sort(compare);
    async_callback(null, transactions);
  }

  function mergeAndTruncateResults(txns, async_callback) {
    let transactions = txns;
    if (options.previous_transactions
        && options.previous_transactions.length > 0) {
      transactions = options.previous_transactions.concat(transactions);
    }
    if (options.offset && options.offset > 0) {
      const offset_remaining = options.offset - transactions.length;
      transactions = transactions.slice(options.offset);
      options.offset = offset_remaining;
    }
    if (transactions.length > options.max) {
      transactions = transactions.slice(0, options.max);
    }
    async_callback(null, transactions);
  }

  function asyncWaterfallCallback(error, transactions) {
    if (error) {
      return callback(error);
    }
    if (!options.min || transactions.length >= options.min || !options.marker) {
      callback(null, transactions);
    } else {
      options.previous_transactions = transactions;
      setImmediate(function() {
        getAccountTransactions(api, options, callback);
      });
    }
  }

  const steps = [
    queryTransactions,
    filterTransactions,
    sortTransactions,
    mergeAndTruncateResults
  ];

  async.waterfall(steps, asyncWaterfallCallback);
}

module.exports = {
  DEFAULT_LIMIT: 200,
  DEFAULT_RESULTS_PER_PAGE: DEFAULT_RESULTS_PER_PAGE,
  NUM_TRANSACTION_TYPES: 5,
  DEFAULT_LEDGER_BUFFER: 3,
  getTransaction: getTransaction,
  getAccountTransactions: getAccountTransactions
};
