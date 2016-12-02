/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const utils = require('./utils')
const {validate, iso8601ToRippleTime, toRippledAmount} = utils.common
import type {Instructions, Prepare} from './types.js'
import type {Adjustment, MaxAdjustment, Memo} from '../common/types.js'

type SuspendedPaymentCreation = {
  source: MaxAdjustment,
  destination: Adjustment,
  memos?: Array<Memo>,
  digest?: string,
  allowCancelAfter?: string,
  allowExecuteAfter?: string
}

function createSuspendedPaymentCreationTransaction(account: string,
    payment: SuspendedPaymentCreation
): Object {
  const txJSON: Object = {
    TransactionType: 'SuspendedPaymentCreate',
    Account: account,
    Destination: payment.destination.address,
    Amount: toRippledAmount(payment.destination.amount)
  }

  if (payment.digest !== undefined) {
    txJSON.Digest = payment.digest
  }
  if (payment.allowCancelAfter !== undefined) {
    txJSON.CancelAfter = iso8601ToRippleTime(payment.allowCancelAfter)
  }
  if (payment.allowExecuteAfter !== undefined) {
    txJSON.FinishAfter = iso8601ToRippleTime(payment.allowExecuteAfter)
  }
  if (payment.source.tag !== undefined) {
    txJSON.SourceTag = payment.source.tag
  }
  if (payment.destination.tag !== undefined) {
    txJSON.DestinationTag = payment.destination.tag
  }
  if (payment.memos !== undefined) {
    txJSON.Memos = _.map(payment.memos, utils.convertMemo)
  }
  return txJSON
}

function prepareSuspendedPaymentCreation(address: string,
  suspendedPaymentCreation: SuspendedPaymentCreation,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareSuspendedPaymentCreation(
    {address, suspendedPaymentCreation, instructions})
  const txJSON = createSuspendedPaymentCreationTransaction(
    address, suspendedPaymentCreation)
  return utils.prepareTransaction(txJSON, this, instructions)
}

module.exports = prepareSuspendedPaymentCreation
