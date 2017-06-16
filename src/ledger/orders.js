/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const utils = require('./utils')
const {validate} = utils.common
const parseAccountOrder = require('./parse/account-order')
import type {Connection} from '../common/connection.js'
import type {OrdersOptions, Order} from './types.js'

type GetOrders = Array<Order>

function requestAccountOffers(connection: Connection, address: string,
  ledgerVersion: number, marker: string, limit: number
): Promise {
  return connection.request({
    command: 'account_offers',
    account: address,
    marker: marker,
    limit: utils.clamp(limit, 10, 400),
    ledger_index: ledgerVersion
  }).then(data => {
    return {
      marker: data.marker,
      results: data.offers.map(_.partial(parseAccountOrder, address))
    }
  })
}

function getOrders(address: string, options: OrdersOptions = {}
): Promise<GetOrders> {
  validate.getOrders({address, options})

  return utils.ensureLedgerVersion.call(this, options).then(_options => {
    const getter = _.partial(requestAccountOffers, this.connection, address,
                             _options.ledgerVersion)
    return utils.getRecursive(getter, _options.limit).then(orders =>
      _.sortBy(orders, order => order.properties.sequence))
  })
}

module.exports = getOrders
