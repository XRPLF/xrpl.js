/* @flow */
'use strict';
const _ = require('lodash');
const assert = require('assert');
const common = require('../common');
const dropsToXrp = common.dropsToXrp;
const composeAsync = common.composeAsync;
import type {Remote} from '../../core/remote';
import type {TransactionType} from './transaction-types';
import type {Issue} from '../common/types.js';

type Callback = (err: any, data: any) => void

type RecursiveData = {
  marker: string,
  results: Array<any>
}

type RecursiveCallback = (err: any, data: RecursiveData) => void

function clamp(value: number, min: number, max: number): number {
  assert(min <= max, 'Illegal clamp bounds');
  return Math.min(Math.max(value, min), max);
}

function getXRPBalance(remote: Remote, address: string, ledgerVersion?: number,
                       callback: Callback
): void {
  const request = {
    command: 'account_info',
    account: address,
    ledger_index: ledgerVersion
  };
  remote.rawRequest(request,
    composeAsync((data) => dropsToXrp(data.account_data.Balance), callback));
}

type Getter = (marker: ?string, limit: number,
  callback: RecursiveCallback) => void

// If the marker is omitted from a response, you have reached the end
// getter(marker, limit, callback), callback(error, {marker, results})
function getRecursiveRecur(getter: Getter, marker?: string, limit: number,
                          callback: Callback
): void {
  getter(marker, limit, (error, data) => {
    if (error) {
      return callback(error);
    }
    const remaining = limit - data.results.length;
    if (remaining > 0 && data.marker !== undefined) {
      getRecursiveRecur(getter, data.marker, remaining, (_error, results) => {
        return _error ? callback(_error) :
          callback(null, data.results.concat(results));
      });
    } else {
      return callback(null, data.results.slice(0, limit));
    }
  });
}

function getRecursive(getter: Getter, limit?: number, callback: Callback) {
  getRecursiveRecur(getter, undefined, limit || Infinity, callback);
}

function renameCounterpartyToIssuer(amount?: Issue): ?{issuer?: string} {
  if (amount === undefined) {
    return undefined;
  }
  const issuer = amount.counterparty === undefined ?
    (amount.issuer !== undefined ? amount.issuer : undefined) :
    amount.counterparty;
  const withIssuer = _.assign({}, amount, {issuer: issuer});
  return _.omit(withIssuer, 'counterparty');
}

type RequestBookOffersArgs = {taker_gets: Issue, taker_pays: Issue}

function renameCounterpartyToIssuerInOrder(order: RequestBookOffersArgs) {
  const taker_gets = renameCounterpartyToIssuer(order.taker_gets);
  const taker_pays = renameCounterpartyToIssuer(order.taker_pays);
  const changes = {taker_gets: taker_gets, taker_pays: taker_pays};
  return _.assign({}, order, _.omit(changes, _.isUndefined));
}

function signum(num) {
  return (num === 0) ? 0 : (num > 0 ? 1 : -1);
}

/**
 *  Order two rippled transactions based on their ledger_index.
 *  If two transactions took place in the same ledger, sort
 *  them based on TransactionIndex
 *  See: https://ripple.com/build/transactions/
 *
 *  @param {Object} first
 *  @param {Object} second
 *  @returns {Number} [-1, 0, 1]
 */

function compareTransactions(first: TransactionType, second: TransactionType
): number {
  if (!first.outcome || !second.outcome) {
    return 0;
  }
  if (first.outcome.ledgerVersion === second.outcome.ledgerVersion) {
    return signum(first.outcome.indexInLedger - second.outcome.indexInLedger);
  }
  return first.outcome.ledgerVersion < second.outcome.ledgerVersion ? -1 : 1;
}

function hasCompleteLedgerRange(remote: Remote, minLedgerVersion?: number,
                                maxLedgerVersion?: number
): boolean {

  const firstLedgerVersion = 32570; // earlier versions have been lost
  return remote.getServer().hasLedgerRange(
    minLedgerVersion || firstLedgerVersion,
    maxLedgerVersion || remote.getLedgerSequenceSync());
}

function isPendingLedgerVersion(remote: Remote, maxLedgerVersion: ?number
): boolean {
  const currentLedger = remote.getLedgerSequenceSync();
  return currentLedger < (maxLedgerVersion || 0);
}

function getLedgerOptionsWithLedgerVersion(account: string, options: Object,
  callback: (err?: ?Error, account?: string, options: Object) => void
) {
  if (Boolean(options) && options.ledgerVersion !== undefined &&
    options.ledgerVersion !== null
  ) {
    callback(null, account, options);
  } else {
    this.getLedgerVersion().then((version) => {
      callback(null, account, _.assign({}, options, {ledgerVersion: version}));
    }, callback);
  }
}

module.exports = {
  getXRPBalance,
  getLedgerOptionsWithLedgerVersion,
  compareTransactions,
  renameCounterpartyToIssuer,
  renameCounterpartyToIssuerInOrder,
  getRecursive,
  hasCompleteLedgerRange,
  isPendingLedgerVersion,
  promisify: common.promisify,
  clamp: clamp,
  common: common
};

