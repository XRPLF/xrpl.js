/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const parseTransaction = require('./parse/transaction');
const getTransaction = require('./transaction');
const validate = utils.common.validate;
const composeAsync = utils.common.composeAsync;

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
  if (filters.initiated === true && tx.address !== address) {
    return false;
  }
  if (filters.initiated === false && tx.address === address) {
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
    limit: utils.clamp(limit, 10, 400),
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

function checkForLedgerGaps(remote, options, transactions) {
  let {minLedgerVersion, maxLedgerVersion} = options;

  // if we reached the limit on number of transactions, then we can shrink
  // the required ledger range to only guarantee that there are no gaps in
  // the range of ledgers spanned by those transactions
  if (options.limit && transactions.length === options.limit) {
    if (options.earliestFirst) {
      maxLedgerVersion = _.last(transactions).outcome.ledgerVersion;
    } else {
      minLedgerVersion = _.last(transactions).outcome.ledgerVersion;
    }
  }

  if (!utils.hasCompleteLedgerRange(remote, minLedgerVersion,
      maxLedgerVersion)) {
    throw new utils.common.errors.MissingLedgerHistoryError();
  }
}

function formatResponse(remote, options, transactions) {
  const compare = options.earliestFirst ? utils.compareTransactions :
    _.rearg(utils.compareTransactions, 1, 0);
  const sortedTransactions = transactions.sort(compare);
  checkForLedgerGaps(remote, options, sortedTransactions);
  return sortedTransactions;
}

function getTransactionsInternal(remote, address, options, callback) {
  const getter = _.partial(getAccountTx, remote, address, options);
  const format = _.partial(formatResponse, remote, options);
  utils.getRecursive(getter, options.limit, composeAsync(format, callback));
}

function getTransactions(account, options, callback) {
  validate.address(account);
  validate.getTransactionsOptions(options);

  const defaults = {maxLedgerVersion: this.remote.getLedgerSequence()};
  if (options.start) {
    getTransaction.bind(this)(options.start, {}, (error, tx) => {
      if (error) {
        callback(error);
        return;
      }
      const ledgerVersion = tx.outcome.ledgerVersion;
      const bound = options.earliestFirst ?
        {minLedgerVersion: ledgerVersion} : {maxLedgerVersion: ledgerVersion};
      const newOptions = _.assign(defaults, options, {startTx: tx}, bound);
      getTransactionsInternal(this.remote, account, newOptions, callback);
    });
  } else {
    const newOptions = _.assign(defaults, options);
    getTransactionsInternal(this.remote, account, newOptions, callback);
  }
}

module.exports = utils.wrapCatch(getTransactions);
