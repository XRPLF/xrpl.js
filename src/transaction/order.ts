import * as _ from 'lodash'
import * as utils from './utils'
const offerFlags = utils.common.txFlags.OfferCreate
import {validate, iso8601ToRippleTime} from '../common'
import {Instructions, Prepare} from './types'
import {Order} from '../ledger/transaction-types'

function createOrderTransaction(account: string, order: Order): Object {
  const takerPays = utils.common.toRippledAmount(order.direction === 'buy' ?
    order.quantity : order.totalPrice)
  const takerGets = utils.common.toRippledAmount(order.direction === 'buy' ?
    order.totalPrice : order.quantity)

  const txJSON: any = {
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

export default prepareOrder
