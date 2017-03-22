/* @flow */
'use strict' // eslint-disable-line strict
const assert = require('assert')
const utils = require('./utils')

function parseEscrowCancellation(tx: Object): Object {
  assert(tx.TransactionType === 'EscrowCancel')

  return utils.removeUndefined({
    memos: utils.parseMemos(tx),
    owner: tx.Owner,
    escrowSequence: tx.OfferSequence
  })
}

module.exports = parseEscrowCancellation
