/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const assert = require('assert')
const utils = require('./utils')
const parseAmount = require('./amount')

function removeGenericCounterparty(amount, address) {
  return amount.counterparty === address ?
    _.omit(amount, 'counterparty') : amount
}

function parseEscrowCreation(tx: Object): Object {
  assert(tx.TransactionType === 'EscrowCreate')

  const source = {
    address: tx.Account,
    maxAmount: removeGenericCounterparty(
      parseAmount(tx.SendMax || tx.Amount), tx.Account),
    tag: tx.SourceTag
  }

  const destination = {
    address: tx.Destination,
    amount: removeGenericCounterparty(parseAmount(tx.Amount), tx.Destination),
    tag: tx.DestinationTag
  }

  return utils.removeUndefined({
    source: utils.removeUndefined(source),
    destination: utils.removeUndefined(destination),
    memos: utils.parseMemos(tx),
    condition: tx.Condition,
    allowCancelAfter: utils.parseTimestamp(tx.CancelAfter),
    allowExecuteAfter: utils.parseTimestamp(tx.FinishAfter)
  })
}

module.exports = parseEscrowCreation
