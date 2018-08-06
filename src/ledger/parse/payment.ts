import * as _ from 'lodash'
import * as assert from 'assert'
import * as utils from './utils'
import {txFlags, removeUndefined} from '../../common'
import parseAmount from './amount'

function isNoDirectRipple(tx) {
  return (tx.Flags & txFlags.Payment.NoRippleDirect) !== 0
}

function isQualityLimited(tx) {
  return (tx.Flags & txFlags.Payment.LimitQuality) !== 0
}

function removeGenericCounterparty(amount, address) {
  return amount.counterparty === address ?
    _.omit(amount, 'counterparty') : amount
}

function parsePayment(tx: any): Object {
  assert(tx.TransactionType === 'Payment')

  const source = {
    address: tx.Account,
    maxAmount: removeGenericCounterparty(
      parseAmount(tx.SendMax || tx.Amount), tx.Account),
    tag: tx.SourceTag
  }

  const destination: {
    address: string,
    amount: any,
    amountInfo?: string,
    tag: number | undefined
  } = {
    address: tx.Destination,
    amount: undefined,
    tag: tx.DestinationTag
  }

  if (!tx.Amount || utils.isPartialPayment(tx)) {
    destination.amount = parseAmount('0')
    destination.amountInfo = '"amount" is omitted from this API response, ' +
      'and set to 0 XRP to prevent misuse. ' +
      'You must use "deliveredAmount" in order to process payments correctly.'
  } else {
    destination.amount = removeGenericCounterparty(
      parseAmount(tx.Amount || '0'), tx.Destination)
  }

  return removeUndefined({
    source: removeUndefined(source),
    destination: removeUndefined(destination),
    memos: utils.parseMemos(tx),
    invoiceID: tx.InvoiceID,
    paths: tx.Paths ? JSON.stringify(tx.Paths) : undefined,
    allowPartialPayment: utils.isPartialPayment(tx) || undefined,
    noDirectRipple: isNoDirectRipple(tx) || undefined,
    limitQuality: isQualityLimited(tx) || undefined
  })
}

export default parsePayment
