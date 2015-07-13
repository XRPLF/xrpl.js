'use strict';
const _ = require('lodash');
const async = require('async');
const utils = require('./utils');
const parseTransaction = require('./parse/transaction');
const validate = utils.common.validate;
const errors = utils.common.errors;

function attachTransactionDate(remote, tx, callback) {
  if (tx.date) {
    callback(null, tx);
    return;
  }
  if (!tx.ledger_index) {
    callback(new errors.NotFoundError('ledger_index not found in tx'));
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
  validate.getTransactionOptions(options);

  const remote = this.remote;
  const maxLedgerVersion = Math.min(options.maxLedgerVersion,
    remote.getLedgerSequence());

  function callbackWrapper(error, tx) {
    if (error instanceof errors.NotFoundError
        && !utils.hasCompleteLedgerRange(remote,
            options.minLedgerVersion, maxLedgerVersion)) {
      callback(new errors.MissingLedgerHistoryError('Transaction not found,'
        + ' but the server\'s ledger history is incomplete'));
    } else if (!error && !isTransactionInRange(tx, options)) {
      callback(new errors.NotFoundError('Transaction not found'));
    } else if (error) {
      callback(error);
    } else {
      callback(error, parseTransaction(tx));
    }
  }

  async.waterfall([
    _.partial(remote.requestTx.bind(remote), {hash: identifier}),
    _.partial(attachTransactionDate, remote)
  ], callbackWrapper);
}

module.exports = utils.wrapCatch(getTransaction);
