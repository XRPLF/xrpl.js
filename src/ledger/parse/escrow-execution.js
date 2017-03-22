/* @flow */
'use strict' // eslint-disable-line strict
const assert = require('assert')
const utils = require('./utils')

function parseEscrowExecution(tx: Object): Object {
  assert(tx.TransactionType === 'EscrowFinish')

  return utils.removeUndefined({
    memos: utils.parseMemos(tx),
    owner: tx.Owner,
    escrowSequence: tx.OfferSequence,
    condition: tx.Condition,
    fulfillment: tx.Fulfillment ? utils.hexToString(tx.Fulfillment) : undefined
  })
}

module.exports = parseEscrowExecution
