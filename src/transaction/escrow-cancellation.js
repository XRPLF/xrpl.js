/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const utils = require('./utils')
const validate = utils.common.validate
import type {Instructions, Prepare} from './types.js'
import type {Memo} from '../common/types.js'

type EscrowCancellation = {
  owner: string,
  escrowSequence: number,
  memos?: Array<Memo>
}

function createEscrowCancellationTransaction(account: string,
  payment: EscrowCancellation
): Object {
  const txJSON: Object = {
    TransactionType: 'EscrowCancel',
    Account: account,
    Owner: payment.owner,
    OfferSequence: payment.escrowSequence
  }
  if (payment.memos !== undefined) {
    txJSON.Memos = _.map(payment.memos, utils.convertMemo)
  }
  return txJSON
}

function prepareEscrowCancellation(address: string,
  escrowCancellation: EscrowCancellation,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareEscrowCancellation(
    {address, escrowCancellation, instructions})
  const txJSON = createEscrowCancellationTransaction(
    address, escrowCancellation)
  return utils.prepareTransaction(txJSON, this, instructions)
}

module.exports = prepareEscrowCancellation
