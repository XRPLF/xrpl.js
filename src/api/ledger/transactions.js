/* eslint-disable valid-jsdoc */
'use strict';
const _ = require('lodash');
const async = require('async');
const utils = require('./utils');
const parseTransaction = require('./parse/transaction');
const validate = utils.common.validate;
const errors = utils.common.errors;

const DEFAULT_LIMIT = 100;
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

function parseAccountTxTransaction(tx) {
  // rippled uses a different response format for 'account_tx' than 'tx'
  tx.tx.meta = tx.meta;
  tx.tx.validated = tx.validated;
  return parseTransaction(tx.tx);
}


function transactionFilter(address, filters, tx) {
  if (filters.excludeFailures && tx.outcome.result !== 'tesSUCCESS') {
    return false;
  }
  if (filters.types && !_.includes(filters.types, tx.type)) {
    return false;
  }
  if (filters.outgoing && tx.address !== address) {
    return false;
  }
  if (filters.incoming && tx.address === address) {
    return false;
  }
  return true;
}

function getAccountTx(remote, address, options, marker, limit, callback) {
  const params = {
    account: address,
    ledger_index_min: options.ledgerVersion || options.minLedgerVersion || -1,
    ledger_index_max: options.ledgerVersion || options.maxLedgerVersion || -1,
    forward: options.earliestFirst,
    binary: options.binary,
    limit: Math.min(limit || DEFAULT_LIMIT, 10),
    marker: marker
  };

  remote.requestAccountTx(params, (error, data) => {
    return error ? callback(error) : callback(null, {
      marker: data.marker,
      results: data.transactions
        .filter((tx) => tx.validated)
        .map(parseAccountTxTransaction)
        .filter(_.partial(transactionFilter, address, options))
    });
  });
}

function getAccountTransactions(address, options, callback) {
  validate.address(address);

  const limit = options.limit || DEFAULT_LIMIT;
  const compare = options.earliestFirst ? utils.compareTransactions :
    _.rearg(utils.compareTransactions, 1, 0);
  const getter = _.partial(getAccountTx, this.remote, address, options);
  utils.getRecursive(getter, limit, (error, data) => {
    return error ? callback(error) : callback(null, data.sort(compare));
  });
}

module.exports = {
  getTransaction: utils.wrapCatch(getTransaction),
  getAccountTransactions: utils.wrapCatch(getAccountTransactions)
};
