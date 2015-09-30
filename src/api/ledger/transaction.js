/* @flow */
'use strict';
const _ = require('lodash');
const async = require('async');
const utils = require('./utils');
const parseTransaction = require('./parse/transaction');
const validate = utils.common.validate;
const errors = utils.common.errors;
const convertErrors = utils.common.convertErrors;
const RippleError = require('../../core/rippleerror').RippleError;

import type {Remote} from '../../core/remote';

import type {CallbackType, GetTransactionResponse,
  GetTransactionResponseCallback, TransactionOptions}
  from './transaction-types';

function attachTransactionDate(remote: Remote, tx: Object,
                              callback: CallbackType
) {
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
      callback(null, _.assign({date: data.ledger.close_time}, tx));
    } else {
      callback(new errors.ApiError('Ledger missing close_time'));
    }
  });
}

function isTransactionInRange(tx: Object, options: TransactionOptions) {
  return (!options.minLedgerVersion
          || tx.ledger_index >= options.minLedgerVersion)
      && (!options.maxLedgerVersion
          || tx.ledger_index <= options.maxLedgerVersion);
}

function getTransactionAsync(identifier: string, options: TransactionOptions,
                             callback: GetTransactionResponseCallback
) {
  validate.identifier(identifier);
  validate.getTransactionOptions(options);

  const remote = this.remote;

  function callbackWrapper(error_?: Error, tx?: Object,
    maxLedgerVersion?: number
  ) {
    let error = error_;

    if (!error && tx && tx.validated !== true) {
      return callback(new errors.NotFoundError('Transaction not found'));
    }

    if (error instanceof RippleError && error.remote &&
      error.remote.error === 'txnNotFound') {
      error = new errors.NotFoundError('Transaction not found');
    }

    // Missing complete ledger range
    if (error instanceof errors.NotFoundError
        && !utils.hasCompleteLedgerRange(remote, options.minLedgerVersion,
                                         maxLedgerVersion)) {
      if (utils.isPendingLedgerVersion(remote, maxLedgerVersion)) {
        callback(new errors.PendingLedgerVersionError());
      } else {
        callback(new errors.MissingLedgerHistoryError());
      }
      // Transaction is found, but not in specified range
    } else if (!error && tx && !isTransactionInRange(tx, options)) {
      callback(new errors.NotFoundError('Transaction not found'));
      // Transaction is not found
    } else if (error) {
      convertErrors(callback)(error);
    } else if (!tx) {
      callback(new errors.ApiError('Internal error'));
    } else {
      callback(error, parseTransaction(tx));
    }
  }


  function maxLedgerGetter(error_?: Error, tx?: Object) {
    this.getLedgerVersion().then((version) => {
      const maxLedgerVersion = options.maxLedgerVersion || version;
      callbackWrapper(error_, tx, maxLedgerVersion);
    }, callbackWrapper);
  }

  async.waterfall([
    _.partial(remote.requestTx.bind(remote),
      {hash: identifier, binary: false}),
    _.partial(attachTransactionDate, remote)
  ], maxLedgerGetter.bind(this));
}

function getTransaction(identifier: string,
                        options: TransactionOptions = {}
): Promise<GetTransactionResponse> {
  return utils.promisify(getTransactionAsync).call(this, identifier, options);
}

module.exports = getTransaction;
