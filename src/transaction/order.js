/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const utils = require('./utils')
const offerFlags = utils.common.txFlags.OfferCreate
const {validate, iso8601ToRippleTime} = utils.common
import type {Instructions, Prepare} from './types.js'
import type {Order} from '../ledger/transaction-types.js'

function createOrderTransaction(account: string, order: Order): Object {
  const takerPays = utils.common.toRippledAmount(order.direction === 'buy' ?
    order.quantity : order.totalPrice)
  const takerGets = utils.common.toRippledAmount(order.direction === 'buy' ?
    order.totalPrice : order.quantity)

  const txJSON: Object = {
    TransactionType: 'OfferCreate',
    Account: account,
    TakerGets: takerGets,
    TakerPays: takerPays,
    Flags: 0
  }
  if (order.direction === 'sell') {
    txJSON.Flags |= offerFlags.Sell
  }
  if (order.passive === true) {
    txJSON.Flags |= offerFlags.Passive
  }
  if (order.immediateOrCancel === true) {
    txJSON.Flags |= offerFlags.ImmediateOrCancel
  }
  if (order.fillOrKill === true) {
    txJSON.Flags |= offerFlags.FillOrKill
  }
  if (order.expirationTime !== undefined) {
    txJSON.Expiration = iso8601ToRippleTime(order.expirationTime)
  }
  if (order.orderToReplace !== undefined) {
    txJSON.OfferSequence = order.orderToReplace
  }
  if (order.memos !== undefined) {
    txJSON.Memos = _.map(order.memos, utils.convertMemo)
  }
  return txJSON
}

function prepareOrder(address: string, order: Order,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareOrder({address, order, instructions})
  const txJSON = createOrderTransaction(address, order)
  return utils.prepareTransaction(txJSON, this, instructions)
}

module.exports = prepareOrder
