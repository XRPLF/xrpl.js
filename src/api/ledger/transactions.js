/* eslint-disable valid-jsdoc */
'use strict';
const _ = require('lodash');
const async = require('async');
const utils = require('./utils');
const parseTransaction = require('./parse/transaction');
const validate = utils.common.validate;
const errors = utils.common.errors;

const DEFAULT_RESULTS_PER_PAGE = 10;
const MIN_LEDGER_VERSION = 32570; // earlier versions have been completely lost

function hasCompleteLedgerRange(remote, options) {
  const minLedgerVersion = options.minLedgerVersion || MIN_LEDGER_VERSION;
  const maxLedgerVersion = options.maxLedgerVersion
    || remote.getLedgerSequence();
  for (let i = minLedgerVersion; i <= maxLedgerVersion; i++) {
    if (!remote.getServer().hasLedger(i)) { // TODO: optimize this
      return false;
    }
  }
  return true;
}

function attachTransactionDate(remote, tx, callback) {
  if (tx.date) {
    callback(null, tx);
    return;
  }
  if (!tx.ledger_index) {
    callback(new errors.ApiError('ledger_index not found in tx'));
    return;
  }

  remote.requestLedger(tx.ledger_index, (error, data) => {
    if (error) {
      callback(new errors.NotFoundError('Transaction ledger not found'));
    } else if (typeof data.ledger.close_time === 'number') {
      callback(null, _.assign({date: data.ledger.close_time, tx}));
    } else {
      callback(new errors.ApiError('Ledger missing close_time'));
    }
  });
}

function isTransactionInRange(tx, options) {
  return (!options.minLedgerVersion
          || tx.ledger_index >= options.minLedgerVersion)
      && (!options.maxLedgerVersion
          || tx.ledger_index <= options.maxLedgerVersion);
}

function getTransaction(identifier, options, callback) {
  validate.identifier(identifier);
  validate.options(options);

  const remote = this.remote;

  function callbackWrapper(error, tx) {
    if (error instanceof errors.NotFoundError
        && !hasCompleteLedgerRange(remote, options)) {
      callback(new errors.MissingLedgerHistoryError('Transaction not found,'
        + ' but the server\'s ledger history is incomplete'));
    } else if (!error && !isTransactionInRange(tx, options)) {
      callback(new errors.NotFoundError('Transaction not found'));
    } else {
      callback(error, parseTransaction(tx));
    }
  }

  async.waterfall([
    _.partial(remote.requestTx.bind(remote), {hash: identifier}),
    _.partial(attachTransactionDate, remote)
  ], callbackWrapper);
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
    const transactions = [];
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
  getTransaction: utils.wrapCatch(getTransaction),
  getAccountTransactions: getAccountTransactions
};
