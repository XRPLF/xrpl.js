/* @flow */
'use strict';
const _ = require('lodash');
const transactionParser = require('ripple-lib-transactionparser');
const toTimestamp = require('../../../core/utils').toTimestamp;
const utils = require('../utils');
const BigNumber = require('bignumber.js');

function adjustQualityForXRP(
  quality: string, takerGetsCurrency: string, takerPaysCurrency: string
) {
  // quality = takerPays.value/takerGets.value
  // using drops (1e-6 XRP) for XRP values
  const numeratorShift = (takerPaysCurrency === 'XRP' ? -6 : 0);
  const denominatorShift = (takerGetsCurrency === 'XRP' ? -6 : 0);
  const shift = numeratorShift - denominatorShift;
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
  const orderbookChanges = transactionParser.parseOrderbookChanges(tx.meta);
  removeEmptyCounterpartyInBalanceChanges(balanceChanges);
  removeEmptyCounterpartyInOrderbookChanges(orderbookChanges);

  return {
    result: tx.meta.TransactionResult,
    timestamp: parseTimestamp(tx),
    fee: utils.common.dropsToXrp(tx.Fee),
    balanceChanges: balanceChanges,
    orderbookChanges: orderbookChanges,
    ledgerVersion: tx.ledger_index,
    indexInLedger: tx.meta.TransactionIndex
  };
}

function hexToString(hex) {
  return hex ? new Buffer(hex, 'hex').toString('utf-8') : undefined;
}

function parseMemos(tx: Object): ?Array<Object> {
  if (!Array.isArray(tx.Memos) || tx.Memos.length === 0) {
    return undefined;
  }
  return tx.Memos.map((m) => {
    return removeUndefined({
      type: m.Memo.parsed_memo_type || hexToString(m.Memo.MemoType),
      format: m.Memo.parsed_memo_format || hexToString(m.Memo.MemoFormat),
      data: m.Memo.parsed_memo_data || hexToString(m.Memo.MemoData)
    });
  });
}

module.exports = {
  parseOutcome,
  parseMemos,
  removeUndefined,
  adjustQualityForXRP,
  dropsToXrp: utils.common.dropsToXrp,
  constants: utils.common.constants,
  txFlags: utils.common.txFlags,
  core: utils.common.core
};
