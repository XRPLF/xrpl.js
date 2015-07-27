'use strict';
const _ = require('lodash');
const assert = require('assert');
const common = require('../common');
const dropsToXrp = common.dropsToXrp;
const composeAsync = common.composeAsync;

function clamp(value, min, max) {
  assert(min <= max, 'Illegal clamp bounds');
  return Math.min(Math.max(value, min), max);
}

function getXRPBalance(remote, address, ledgerVersion, callback) {
  remote.requestAccountInfo({account: address, ledger: ledgerVersion},
    composeAsync((data) => dropsToXrp(data.account_data.Balance), callback));
}

// If the marker is omitted from a response, you have reached the end
// getter(marker, limit, callback), callback(error, {marker, results})
function getRecursiveRecur(getter, marker, limit, callback) {
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

function getRecursive(getter, limit, callback) {
  getRecursiveRecur(getter, undefined, limit || Infinity, callback);
}

function renameCounterpartyToIssuer(amount) {
  if (amount === undefined) {
    return undefined;
  }
  const issuer = amount.counterparty === undefined ?
    amount.issuer : amount.counterparty;
  const withIssuer = _.assign({}, amount, {issuer: issuer});
  return _.omit(withIssuer, 'counterparty');
}

function renameCounterpartyToIssuerInOrder(order) {
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

function compareTransactions(first, second) {
  if (first.outcome.ledgerVersion === second.outcome.ledgerVersion) {
    return signum(Number(first.outcome.indexInLedger) -
      Number(second.outcome.indexInLedger));
  }
  return Number(first.outcome.ledgerVersion) <
    Number(second.outcome.ledgerVersion) ? -1 : 1;
}

function hasCompleteLedgerRange(remote, minLedgerVersion, maxLedgerVersion) {
  const firstLedgerVersion = 32570; // earlier versions have been lost
  return remote.getServer().hasLedgerRange(
    minLedgerVersion || firstLedgerVersion,
    maxLedgerVersion || remote.getLedgerSequence());
}

module.exports = {
  getXRPBalance,
  compareTransactions,
  renameCounterpartyToIssuer,
  renameCounterpartyToIssuerInOrder,
  getRecursive,
  hasCompleteLedgerRange,
  wrapCatch: common.wrapCatch,
  clamp: clamp,
  common: common
};

