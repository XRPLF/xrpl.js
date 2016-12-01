/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const utils = require('./utils')
const validate = utils.common.validate
import type {Instructions, Prepare} from './types.js'

function createOrderCancellationTransaction(account: string,
    orderCancellation: Object
): Object {
  const txJSON: Object = {
    TransactionType: 'OfferCancel',
    Account: account,
    OfferSequence: orderCancellation.orderSequence
  }
  if (orderCancellation.memos !== undefined) {
    txJSON.Memos = _.map(orderCancellation.memos, utils.convertMemo)
  }
  return txJSON
}

function prepareOrderCancellation(address: string, orderCancellation: Object,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareOrderCancellation({address, orderCancellation, instructions})
  const txJSON = createOrderCancellationTransaction(address, orderCancellation)
  return utils.prepareTransaction(txJSON, this, instructions)
}

module.exports = prepareOrderCancellation
