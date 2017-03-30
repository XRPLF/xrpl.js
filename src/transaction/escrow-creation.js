/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const utils = require('./utils')
const {validate, iso8601ToRippleTime, toRippledAmount} = utils.common
const ValidationError = utils.common.errors.ValidationError
import type {Instructions, Prepare} from './types.js'
import type {Adjustment, MaxAdjustment, Memo} from '../common/types.js'

type EscrowCreation = {
  source: MaxAdjustment,
  destination: Adjustment,
  memos?: Array<Memo>,
  condition?: string,
  allowCancelAfter?: string,
  allowExecuteAfter?: string
}

function createEscrowCreationTransaction(account: string,
    payment: EscrowCreation
): Object {
  const txJSON: Object = {
    TransactionType: 'EscrowCreate',
    Account: account,
    Destination: payment.destination.address,
    Amount: toRippledAmount(payment.destination.amount)
  }

  if (txJSON.Amount.currency !== undefined) {
    throw new ValidationError('"Amount" currency must be XRP')
  }
  if (payment.condition !== undefined) {
    txJSON.Condition = payment.condition
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
  if (Boolean(payment.allowCancelAfter) && Boolean(payment.allowExecuteAfter) &&
      txJSON.CancelAfter <= txJSON.FinishAfter) {
    throw new ValidationError('"CancelAfter" must be after "FinishAfter" for'
      + ' EscrowCreate')
  }
  return txJSON
}

function prepareEscrowCreation(address: string,
  escrowCreation: EscrowCreation,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareEscrowCreation(
    {address, escrowCreation, instructions})
  const txJSON = createEscrowCreationTransaction(
    address, escrowCreation)
  return utils.prepareTransaction(txJSON, this, instructions)
}

module.exports = prepareEscrowCreation
