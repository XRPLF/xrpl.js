/* @flow */
'use strict';
const assert = require('assert');
const parseOrderBase = require('./order-base');

function parseOrder(tx: Object): Object {
  assert(tx.TransactionType === 'OfferCreate');
  return parseOrderBase(tx.TakerGets, tx.TakerPays, tx.Flags);
}

module.exports = parseOrder;
