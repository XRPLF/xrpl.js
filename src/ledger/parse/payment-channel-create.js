/* @flow */
'use strict' // eslint-disable-line strict
const assert = require('assert')
const utils = require('./utils')
const parseAmount = require('./amount')

function parsePaymentChannelCreate(tx: Object): Object {
  assert(tx.TransactionType === 'PaymentChannelCreate')

  return utils.removeUndefined({
    amount: parseAmount(tx.Amount).value,
    destination: tx.Destination,
    settleDelay: tx.SettleDelay,
    publicKey: tx.PublicKey,
    cancelAfter: tx.CancelAfter && utils.parseTimestamp(tx.CancelAfter),
    sourceTag: tx.SourceTag,
    destinationTag: tx.DestinationTag
  })
}

module.exports = parsePaymentChannelCreate
