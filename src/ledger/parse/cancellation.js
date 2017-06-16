/* @flow */
'use strict' // eslint-disable-line strict
const assert = require('assert')

function parseOrderCancellation(tx: Object): Object {
  assert(tx.TransactionType === 'OfferCancel')
  return {
    orderSequence: tx.OfferSequence
  }
}

module.exports = parseOrderCancellation
