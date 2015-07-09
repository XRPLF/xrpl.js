'use strict';
const _ = require('lodash');
const utils = require('./utils');
const parseTransaction = require('./parse/transaction');
const getTransaction = require('./transaction');
const validate = utils.common.validate;
const composeAsync = utils.common.composeAsync;
const DEFAULT_LIMIT = 100;

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
  if (filters.counterparty && tx.address !== filters.counterparty
      && tx.Destination !== filters.counterparty) {
    return false;
  }
  return true;
}

function orderFilter(options, tx) {
  return !options.startTx || (options.earliestFirst ?
    utils.compareTransactions(tx, options.startTx) > 0 :
    utils.compareTransactions(tx, options.startTx) < 0);
}

function getAccountTx(remote, address, options, marker, limit, callback) {
  const params = {
    account: address,
    ledger_index_min: options.minLedgerVersion || -1,
    ledger_index_max: options.maxLedgerVersion || -1,
    forward: options.earliestFirst,
    binary: options.binary,
    limit: Math.max(limit || DEFAULT_LIMIT, 10),
    marker: marker
  };

  remote.requestAccountTx(params, (error, data) => {
    return error ? callback(error) : callback(null, {
      marker: data.marker,
      results: data.transactions
        .filter((tx) => tx.validated)
        .map(parseAccountTxTransaction)
        .filter(_.partial(transactionFilter, address, options))
        .filter(_.partial(orderFilter, options))
    });
  });
}

function getTransactionsInternal(remote, address, options, callback) {
  const limit = options.limit || DEFAULT_LIMIT;
  const compare = options.earliestFirst ? utils.compareTransactions :
    _.rearg(utils.compareTransactions, 1, 0);
  const getter = _.partial(getAccountTx, remote, address, options);
  utils.getRecursive(getter, limit,
    composeAsync((txs) => txs.sort(compare), callback));
}

function getTransactions(address, options, callback) {
  validate.address(address);
  validate.getTransactionsOptions(options);

  const remote = this.remote;
  if (!utils.hasCompleteLedgerRange(remote, options.minLedgerVersion,
      options.maxLedgerVersion)) {
    callback(new utils.common.errors.MissingLedgerHistoryError());
  }

  if (options.start) {
    getTransaction.bind(this)(options.start, {}, (error, tx) => {
      if (error) {
        callback(error);
        return;
      }
      const ledgerVersion = tx.outcome.ledgerVersion;
      const ledgerOption = options.earliestFirst ?
        {minLedgerVersion: ledgerVersion} : {maxLedgerVersion: ledgerVersion};
      const newOptions = _.assign({}, options, {startTx: tx}, ledgerOption);
      getTransactionsInternal(remote, address, newOptions, callback);
    });
  } else {
    getTransactionsInternal(remote, address, options, callback);
  }
}

module.exports = utils.wrapCatch(getTransactions);
