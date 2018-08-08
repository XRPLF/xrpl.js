import * as _ from 'lodash'
import * as assert from 'assert'
import * as utils from './utils'
import {txFlags, removeUndefined} from '../../common'
import parseAmount from './amount'
import {Amount} from '../../common/types/objects'

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

function parsePayment(tx: any, includeRawTransaction: boolean): Object {
  assert(tx.TransactionType === 'Payment')

  const source = {
    address: tx.Account,
    maxAmount: removeGenericCounterparty(
      parseAmount(tx.SendMax || tx.Amount), tx.Account),
    tag: tx.SourceTag
  }

  const destination: {
    address: string,
    amount?: Amount,
    amountInfo?: string,
    tag: number | undefined
  } = {
    address: tx.Destination,
    tag: tx.DestinationTag
  }

  // Omit 'amount' for partial payments to prevent misuse
  if (tx.Amount && !utils.isPartialPayment(tx)) {
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
    limitQuality: isQualityLimited(tx) || undefined,
    rawTransaction: includeRawTransaction ? JSON.stringify(tx) : undefined
  })
}

export default parsePayment
