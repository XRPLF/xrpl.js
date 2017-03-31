/* @flow */
'use strict' // eslint-disable-line strict
const assert = require('assert')
const utils = require('./utils')
const parseAmount = require('./amount')
const claimFlags = utils.txFlags.PaymentChannelClaim

function parsePaymentChannelClaim(tx: Object): Object {
  assert(tx.TransactionType === 'PaymentChannelClaim')

  return utils.removeUndefined({
    channel: tx.Channel,
    balance: tx.Balance && parseAmount(tx.Balance).value,
    amount: tx.Amount && parseAmount(tx.Amount).value,
    signature: tx.Signature,
    publicKey: tx.PublicKey,
    renew: Boolean(tx.Flags & claimFlags.Renew) || undefined,
    close: Boolean(tx.Flags & claimFlags.Close) || undefined
  })
}

module.exports = parsePaymentChannelClaim
