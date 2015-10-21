/* @flow */
'use strict';
const _ = require('lodash');
const async = require('async');
const utils = require('./utils');
const {validate, composeAsync, convertErrors} = utils.common;
const parseAccountOrder = require('./parse/account-order');
import type {Remote} from '../../core/remote';
import type {OrdersOptions, Order} from './types.js';

type GetOrders = Array<Order>

function requestAccountOffers(remote: Remote, address: string,
  ledgerVersion: number, marker: string, limit: number, callback
) {
  remote.rawRequest({
    command: 'account_offers',
    account: address,
    marker: marker,
    limit: utils.clamp(limit, 10, 400),
    ledger_index: ledgerVersion
  },
  composeAsync((data) => ({
    marker: data.marker,
    results: data.offers.map(_.partial(parseAccountOrder, address))
  }), convertErrors(callback)));
}

function getOrdersAsync(account: string, options: OrdersOptions, callback) {
  validate.address(account);
  validate.getOrdersOptions(options);

  const getter = _.partial(requestAccountOffers, this.remote, account,
                           options.ledgerVersion);
  utils.getRecursive(getter, options.limit,
    composeAsync((orders) => _.sortBy(orders,
      (order) => order.properties.sequence), callback));
}

function getOrders(account: string, options: OrdersOptions = {}
): Promise<GetOrders> {
  return utils.promisify(async.seq(
    utils.getLedgerOptionsWithLedgerVersion,
    getOrdersAsync)).call(this, account, options);
}

module.exports = getOrders;
