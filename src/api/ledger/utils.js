/* eslint-disable valid-jsdoc */
'use strict';
const _ = require('lodash');
const async = require('async');
const asyncify = require('simple-asyncify');
const common = require('../common');
const ripple = common.core;

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
  getRecursiveRecur(getter, undefined, limit, callback);
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

function isValidHash256(hash) {
  return ripple.UInt256.is_valid(hash);
}

function parseLedger(ledger) {
  if (/^current$|^closed$|^validated$/.test(ledger)) {
    return ledger;
  }

  if (ledger && Number(ledger) >= 0 && isFinite(Number(ledger))) {
    return Number(ledger);
  }

  if (isValidHash256(ledger)) {
    return ledger;
  }

  return 'validated';
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
  if (first.ledgerVersion === second.ledgerVersion) {
    return signum(Number(first.indexInLedger) - Number(second.indexInLedger));
  }
  return Number(first.ledgerVersion) < Number(second.ledgerVersion) ? -1 : 1;
}

function attachDate(api, baseTransactions, callback) {
  const groupedTx = _.groupBy(baseTransactions, function(tx) {
    return tx.ledger_index;
  });

  function attachDateToTransactions(transactions, data) {
    return _.map(transactions, function(tx) {
      return _.assign(tx, {date: data.ledger.close_time});
    });
  }

  function getLedger(ledgerIndex, _callback) {
    api.remote.requestLedger({ledger_index: ledgerIndex}, _callback);
  }

  function attachDateToLedgerTransactions(_groupedTx, ledger, _callback) {
    const transactions = _groupedTx[ledger];
    async.waterfall([
      _.partial(getLedger, Number(ledger)),
      asyncify(_.partial(attachDateToTransactions, transactions))
    ], _callback);
  }

  const ledgers = _.keys(groupedTx);
  const flatMap = async.seq(async.map, asyncify(_.flatten));
  const iterator = _.partial(attachDateToLedgerTransactions, groupedTx);
  flatMap(ledgers, iterator, callback);
}

module.exports = {
  parseLedger: parseLedger,
  compareTransactions: compareTransactions,
  renameCounterpartyToIssuer: renameCounterpartyToIssuer,
  renameCounterpartyToIssuerInOrder: renameCounterpartyToIssuerInOrder,
  attachDate: attachDate,
  getRecursive: getRecursive,
  wrapCatch: common.wrapCatch,
  common: common
};

