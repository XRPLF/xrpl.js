/* @flow */
'use strict' // eslint-disable-line strict
const utils = require('../utils')
import type {Amount, RippledAmount} from '../../common/types.js'


function parseAmount(amount: RippledAmount): Amount {
  if (typeof amount === 'string') {
    return {
      currency: 'XRP',
      value: utils.common.dropsToXrp(amount)
    }
  }
  return {
    currency: amount.currency,
    value: amount.value,
    counterparty: amount.issuer
  }
}

module.exports = parseAmount
