/* @flow */
'use strict' // eslint-disable-line strict
const assert = require('assert')
const utils = require('./utils')
const flags = utils.txFlags.TrustSet

function parseFlag(flagsValue, trueValue, falseValue) {
  if (flagsValue & trueValue) {
    return true
  }
  if (flagsValue & falseValue) {
    return false
  }
  return undefined
}

function parseTrustline(tx: Object): Object {
  assert(tx.TransactionType === 'TrustSet')

  return utils.removeUndefined({
    limit: tx.LimitAmount.value,
    currency: tx.LimitAmount.currency,
    counterparty: tx.LimitAmount.issuer,
    qualityIn: utils.parseQuality(tx.QualityIn),
    qualityOut: utils.parseQuality(tx.QualityOut),
    ripplingDisabled: parseFlag(
      tx.Flags, flags.SetNoRipple, flags.ClearNoRipple),
    frozen: parseFlag(tx.Flags, flags.SetFreeze, flags.ClearFreeze),
    authorized: parseFlag(tx.Flags, flags.SetAuth, 0)
  })
}

module.exports = parseTrustline
