/* @flow */
'use strict';
const _ = require('lodash');
const transactionParser = require('ripple-lib-transactionparser');
const toTimestamp = require('../../../core/utils').toTimestamp;
const utils = require('../utils');
const BigNumber = require('bignumber.js');

function adjustQualityForXRP(quality: string, takerGetsCurrency: string,
    takerPaysCurrency: string) {
  const shift = (takerGetsCurrency === 'XRP' ? 6 : 0)
              - (takerPaysCurrency === 'XRP' ? 6 : 0);
  return shift === 0 ? quality :
    (new BigNumber(quality)).shift(shift).toString();
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
  adjustQualityForXRP,
  dropsToXrp: utils.common.dropsToXrp,
  constants: utils.common.constants,
  core: utils.common.core
};
