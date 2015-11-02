/* @flow */
'use strict';
const utils = require('./utils');
const offerFlags = utils.common.txFlags.OfferCreate;
const {validate, iso8601ToRippleTime} = utils.common;
import type {Instructions, Prepare} from './types.js';
import type {Order} from '../ledger/transaction-types.js';

function createOrderTransaction(account: string, order: Order): Object {
  validate.address(account);
  validate.order(order);

  const takerPays = utils.common.toRippledAmount(order.direction === 'buy' ?
    order.quantity : order.totalPrice);
  const takerGets = utils.common.toRippledAmount(order.direction === 'buy' ?
    order.totalPrice : order.quantity);

  const txJSON: Object = {
    TransactionType: 'OfferCreate',
    Account: account,
    TakerGets: takerGets,
    TakerPays: takerPays,
    Flags: 0
  };
  if (order.direction === 'sell') {
    txJSON.Flags |= offerFlags.Sell;
  }
  if (order.passive === true) {
    txJSON.Flags |= offerFlags.Passive;
  }
  if (order.immediateOrCancel === true) {
    txJSON.Flags |= offerFlags.ImmediateOrCancel;
  }
  if (order.fillOrKill === true) {
    txJSON.Flags |= offerFlags.FillOrKill;
  }
  if (order.expirationTime !== undefined) {
    txJSON.Expiration = iso8601ToRippleTime(order.expirationTime);
  }
  return txJSON;
}

function prepareOrder(account: string, order: Order,
    instructions: Instructions = {}
): Promise<Prepare> {
  const txJSON = createOrderTransaction(account, order);
  return utils.prepareTransaction(txJSON, this, instructions);
}

module.exports = prepareOrder;
