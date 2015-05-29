/* eslint-disable valid-jsdoc */
'use strict';
const _ = require('lodash');
const async = require('async');
const asyncify = require('simple-asyncify');
const common = require('../common');
const ripple = common.core;
const validator = common.schemaValidator;

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
  return validator.isValid(hash, 'Hash256');
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

function parseCurrencyAmount(rippledAmount, useIssuer) {
  const amount = {};

  if (typeof rippledAmount === 'string') {
    amount.currency = 'XRP';
    amount.value = common.dropsToXrp(rippledAmount);
    if (useIssuer) {
      amount.issuer = '';
    } else {
      amount.counterparty = '';
    }
  } else {
    amount.currency = rippledAmount.currency;
    amount.value = rippledAmount.value;
    if (useIssuer) {
      amount.issuer = rippledAmount.issuer;
    } else {
      amount.counterparty = rippledAmount.issuer;
    }
  }

  return amount;
}


function parseCurrencyQuery(query) {
  const params = query.split('+');

  if (!isNaN(params[0])) {
    return {
      value: (params.length >= 1 ? params[0] : ''),
      currency: (params.length >= 2 ? params[1] : ''),
      counterparty: (params.length >= 3 ? params[2] : '')
    };
  }
  return {
    currency: (params.length >= 1 ? params[0] : ''),
    counterparty: (params.length >= 2 ? params[1] : '')
  };
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
  if (first.ledger_index === second.ledger_index) {
    return signum(
      Number(first.meta.TransactionIndex) -
      Number(second.meta.TransactionIndex));
  }
  return Number(first.ledger_index) < Number(second.ledger_index) ? -1 : 1;
}

function isValidLedgerSequence(ledger) {
  return (Number(ledger) >= 0) && isFinite(Number(ledger));
}

function isValidLedgerHash(ledger) {
  return ripple.UInt256.is_valid(ledger);
}

function isValidLedgerWord(ledger) {
  return (/^current$|^closed$|^validated$/.test(ledger));
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
  isValidLedgerSequence: isValidLedgerSequence,
  isValidLedgerWord: isValidLedgerWord,
  isValidLedgerHash: isValidLedgerHash,
  parseLedger: parseLedger,
  parseCurrencyAmount: parseCurrencyAmount,
  parseCurrencyQuery: parseCurrencyQuery,
  compareTransactions: compareTransactions,
  renameCounterpartyToIssuer: renameCounterpartyToIssuer,
  renameCounterpartyToIssuerInOrder: renameCounterpartyToIssuerInOrder,
  attachDate: attachDate,
  common: common
};

