import * as assert from 'assert'

import _ from 'lodash'

import { txFlags } from '../../common'
import { removeUndefined } from '../../utils'

import parseAmount from './amount'
import * as utils from './utils'

function isNoDirectRipple(tx) {
  return (tx.Flags & txFlags.Payment.NoRippleDirect) !== 0
}

function isQualityLimited(tx) {
  return (tx.Flags & txFlags.Payment.LimitQuality) !== 0
}

function removeGenericCounterparty(amount, address) {
  return amount.counterparty === address
    ? _.omit(amount, 'counterparty')
    : amount
}

// Payment specification
function parsePayment(tx: any): object {
  assert.ok(tx.TransactionType === 'Payment')

  const source = {
    address: tx.Account,
    maxAmount: removeGenericCounterparty(
      parseAmount(tx.SendMax || tx.Amount),
      tx.Account,
    ),
    tag: tx.SourceTag,
  }

  const destination: {
    address: string
    tag: number | undefined
  } = {
    address: tx.Destination,
    tag: tx.DestinationTag,
    // Notice that `amount` is omitted to prevent misinterpretation
  }

  return removeUndefined({
    source: removeUndefined(source),
    destination: removeUndefined(destination),
    memos: utils.parseMemos(tx),
    invoiceID: tx.InvoiceID,
    paths: tx.Paths ? JSON.stringify(tx.Paths) : undefined,
    allowPartialPayment: utils.isPartialPayment(tx) || undefined,
    noDirectRipple: isNoDirectRipple(tx) || undefined,
    limitQuality: isQualityLimited(tx) || undefined,
  })
}

export default parsePayment
