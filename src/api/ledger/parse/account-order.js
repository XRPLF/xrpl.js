'use strict';
const parseOrderBase = require('./order-base');

// rippled 'account_offers' returns a different format for orders than 'tx'
function parseAccountOrder(order) {
  const specification = parseOrderBase(
    order.taker_gets, order.taker_pays, order.flags);
  const state = {
    sequence: order.seq
  };
  return {specification, state};
}

module.exports = parseAccountOrder;
