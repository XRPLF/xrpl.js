import * as _ from 'lodash'
import {validate} from '../common'
import parseAccountOrder from './parse/account-order'
import {Order} from './types'
import {RippleAPI} from '../api'
import {AccountOffersResponse} from '../common/types/commands/account_offers'

export type GetOrdersOptions = {
  limit?: number,
  ledgerVersion?: number
}

function formatResponse(
  address: string, responses: AccountOffersResponse[]
): Order[] {
  let orders: Order[] = []
  for (const response of responses) {
    const offers = response.offers.map(offer => {
      return parseAccountOrder(address, offer)
    })
    orders = orders.concat(offers)
  }
  return _.sortBy(orders, order => order.properties.sequence)
}

export default async function getOrders(
  this: RippleAPI, address: string, options: GetOrdersOptions = {}
): Promise<Order[]> {
  // 1. Validate
  validate.getOrders({address, options})
  // 2. Make Request
  const responses = await this._requestAll('account_offers', {
    account: address,
    ledger_index: options.ledgerVersion || await this.getLedgerVersion(),
    limit: options.limit
  })
  // 3. Return Formatted Response
  return formatResponse(address, responses)
}
