/* @flow */
'use strict';
const _ = require('lodash');
const assert = require('assert');
const common = require('../common');
const dropsToXrp = common.dropsToXrp;
const composeAsync = common.composeAsync;
import type {Remote} from '../../core/remote';

type Callback = (err: any, data: any) => void

function clamp(value: number, min: number, max: number): number {
  assert(min <= max, 'Illegal clamp bounds');
  return Math.min(Math.max(value, min), max);
}

function getXRPBalance(remote: Remote, address: string, ledgerVersion?: number,
                       callback: Callback
): void {
  remote.requestAccountInfo({account: address, ledger: ledgerVersion},
    composeAsync((data) => dropsToXrp(data.account_data.Balance), callback));
}

type Getter = (marker: ?string, limit: number, callback: Callback) => void

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

type Amount = {counterparty?: string, issuer?: string, value: string}

function renameCounterpartyToIssuer(amount?: Amount): ?{issuer?: string} {
  if (amount === undefined) {
    return undefined;
  }
  const issuer = amount.counterparty === undefined ?
    amount.issuer : amount.counterparty;
  const withIssuer = _.assign({}, amount, {issuer: issuer});
  return _.omit(withIssuer, 'counterparty');
}

type Order = {taker_gets: Amount, taker_pays: Amount}

function renameCounterpartyToIssuerInOrder(order: Order) {
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

type Outcome = {outcome: {ledgerVersion: number, indexInLedger: number}};

function compareTransactions(first: Outcome, second: Outcome): number {
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
    maxLedgerVersion || remote.getLedgerSequence());
}

function isPendingLedgerVersion(remote: Remote, maxLedgerVersion: ?number
): boolean {
  const currentLedger = remote.getLedgerSequence();
  return currentLedger < (maxLedgerVersion || 0);
}

module.exports = {
  getXRPBalance,
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

