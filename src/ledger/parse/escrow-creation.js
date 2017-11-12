/* @flow */
'use strict' // eslint-disable-line strict
const assert = require('assert')
const utils = require('./utils')
const parseAmount = require('./amount')

function parseEscrowCreation(tx: Object): Object {
  assert(tx.TransactionType === 'EscrowCreate')

  return utils.removeUndefined({
    amount: parseAmount(tx.Amount).value,
    destination: tx.Destination,
    memos: utils.parseMemos(tx),
    condition: tx.Condition,
    allowCancelAfter: utils.parseTimestamp(tx.CancelAfter),
    allowExecuteAfter: utils.parseTimestamp(tx.FinishAfter),
    sourceTag: tx.SourceTag,
    destinationTag: tx.DestinationTag
  })
}

module.exports = parseEscrowCreation
