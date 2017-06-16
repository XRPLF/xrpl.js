/* @flow */
'use strict' // eslint-disable-line strict
const assert = require('assert')
const utils = require('./utils')
const parseAmount = require('./amount')

function parsePaymentChannelFund(tx: Object): Object {
  assert(tx.TransactionType === 'PaymentChannelFund')

  return utils.removeUndefined({
    channel: tx.Channel,
    amount: parseAmount(tx.Amount).value,
    expiration: tx.Expiration && utils.parseTimestamp(tx.Expiration)
  })
}

module.exports = parsePaymentChannelFund
