/* @flow */
'use strict';
const _ = require('lodash');
const transactionParser = require('ripple-lib-transactionparser');
const utils = require('../utils');
const BigNumber = require('bignumber.js');
const parseAmount = require('./amount');

import type {Amount} from '../common/types.js';

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

function parseQuality(quality: ?number) {
  if (typeof quality === 'number') {
    return (new BigNumber(quality)).shift(-9).toNumber();
  }
  return undefined;
}

function parseTimestamp(rippleTime: number): string | void {
  return rippleTime ? utils.common.rippleTimeToISO8601(rippleTime) : undefined;
}

function removeEmptyCounterparty(amount) {
  if (amount.counterparty === '') {
    delete amount.counterparty;
  }
}

function removeEmptyCounterpartyInBalanceChanges(balanceChanges) {
  _.forEach(balanceChanges, changes => {
    _.forEach(changes, removeEmptyCounterparty);
  });
}

function removeEmptyCounterpartyInOrderbookChanges(orderbookChanges) {
  _.forEach(orderbookChanges, changes => {
    _.forEach(changes, change => {
      _.forEach(change, removeEmptyCounterparty);
    });
  });
}

function isPartialPayment(tx) {
  return (tx.Flags & utils.common.txFlags.Payment.PartialPayment) !== 0;
}

function parseDeliveredAmount(tx: Object): Amount | void {
  let deliveredAmount;

  if (tx.TransactionType === 'Payment') {
    if (tx.meta.delivered_amount) {
      deliveredAmount = parseAmount(tx.meta.delivered_amount);
    } else if (tx.Amount && !isPartialPayment(tx)) {
      deliveredAmount = parseAmount(tx.Amount);
    }
  }

  return deliveredAmount;
}

function parseOutcome(tx: Object): ?Object {
  const metadata = tx.meta || tx.metaData;
  if (!metadata) {
    return undefined;
  }
  const balanceChanges = transactionParser.parseBalanceChanges(metadata);
  const orderbookChanges = transactionParser.parseOrderbookChanges(metadata);
  removeEmptyCounterpartyInBalanceChanges(balanceChanges);
  removeEmptyCounterpartyInOrderbookChanges(orderbookChanges);

  return utils.common.removeUndefined({
    result: tx.meta.TransactionResult,
    timestamp: parseTimestamp(tx.date),
    fee: utils.common.dropsToXrp(tx.Fee),
    balanceChanges: balanceChanges,
    orderbookChanges: orderbookChanges,
    ledgerVersion: tx.ledger_index,
    indexInLedger: tx.meta.TransactionIndex,
    deliveredAmount: parseDeliveredAmount(tx)
  });
}

function hexToString(hex: string): ?string {
  return hex ? new Buffer(hex, 'hex').toString('utf-8') : undefined;
}

function parseMemos(tx: Object): ?Array<Object> {
  if (!Array.isArray(tx.Memos) || tx.Memos.length === 0) {
    return undefined;
  }
  return tx.Memos.map(m => {
    return utils.common.removeUndefined({
      type: m.Memo.parsed_memo_type || hexToString(m.Memo.MemoType),
      format: m.Memo.parsed_memo_format || hexToString(m.Memo.MemoFormat),
      data: m.Memo.parsed_memo_data || hexToString(m.Memo.MemoData)
    });
  });
}

module.exports = {
  parseQuality,
  parseOutcome,
  parseMemos,
  hexToString,
  parseTimestamp,
  adjustQualityForXRP,
  isPartialPayment,
  dropsToXrp: utils.common.dropsToXrp,
  constants: utils.common.constants,
  txFlags: utils.common.txFlags,
  removeUndefined: utils.common.removeUndefined,
  rippleTimeToISO8601: utils.common.rippleTimeToISO8601
};
