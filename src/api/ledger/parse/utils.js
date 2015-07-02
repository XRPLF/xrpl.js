/* @flow */
'use strict';
const _ = require('lodash');
const BigNumber = require('bignumber.js');
const transactionParser = require('ripple-lib-transactionparser');
const toTimestamp = require('../../../core/utils').toTimestamp;
const utils = require('../utils');

/*:: type XRPAmount = {currency: string, value: string} */
/*:: type IOUAmount = {currency: string, value: string, counterparty: string} */
/*:: type Amount = XRPAmount | IOUAmount */
function calculatePrice(totalPrice: Amount, quantity: Amount) {
  const quotient = new BigNumber(totalPrice.value).dividedBy(quantity.value);
  const value = quotient.toDigits(16, BigNumber.ROUND_HALF_UP).toString();
  return _.assign({}, totalPrice, {value});
}

function invertQuality(quality: string) {
  return (new BigNumber(quality)).toPower(-1)
    .toDigits(16, BigNumber.ROUND_HALF_UP).toString();
}

function parseTimestamp(tx: {date: string}): string | void {
  return tx.date ? (new Date(toTimestamp(tx.date))).toISOString() : undefined;
}

function removeUndefined(obj: Object): Object {
  return _.omit(obj, _.isUndefined);
}

function removeEmptyCounterparty(amount) {
  if (amount.counterparty === '') {
    delete amount.counterparty;
  }
}

function removeEmptyCounterpartyInBalanceChanges(balanceChanges) {
  _.forEach(balanceChanges, (changes) => {
    _.forEach(changes, removeEmptyCounterparty);
  });
}

function removeEmptyCounterpartyInOrderbookChanges(orderbookChanges) {
  _.forEach(orderbookChanges, (changes) => {
    _.forEach(changes, (change) => {
      _.forEach(change, removeEmptyCounterparty);
    });
  });
}

function parseOutcome(tx: Object): ?Object {
  if (!tx.validated) {
    return undefined;
  }

  const balanceChanges = transactionParser.parseBalanceChanges(tx.meta);
  const orderbookChanges = transactionParser.parseOrderBookChanges(tx.meta);
  removeEmptyCounterpartyInBalanceChanges(balanceChanges);
  removeEmptyCounterpartyInOrderbookChanges(orderbookChanges);

  return {
    result: tx.meta.TransactionResult,
    timestamp: parseTimestamp(tx),
    fee: utils.common.dropsToXrp(tx.Fee),
    balanceChanges: balanceChanges,
    orderbookChanges: orderbookChanges,
    ledgerVersion: tx.ledger_index,
    indexInLedger: tx.meta.TransactionIndex,
    sequence: tx.Sequence
  };
}

module.exports = {
  parseOutcome,
  removeUndefined,
  calculatePrice,
  invertQuality,
  dropsToXrp: utils.common.dropsToXrp,
  constants: utils.common.constants,
  core: utils.common.core
};
