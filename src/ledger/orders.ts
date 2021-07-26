import * as _ from 'lodash'
import {validate} from '../common'
import {FormattedAccountOrder, parseAccountOrder} from './parse/account-order'
import {RippleAPI} from '..'
import {AccountOffersResponse} from '../common/types/commands'

export type GetOrdersOptions = {
  limit?: number
  ledgerVersion?: number
}

function formatResponse(
  address: string,
  responses: AccountOffersResponse[]
): FormattedAccountOrder[] {
  let orders: FormattedAccountOrder[] = []
  for (const response of responses) {
    const offers = response.offers.map((offer) => {
      return parseAccountOrder(address, offer)
    })
    orders = orders.concat(offers)
  }
  return _.sortBy(orders, (order) => order.properties.sequence)
}

export default async function getOrders(
  this: RippleAPI,
  address: string,
  options: GetOrdersOptions = {}
): Promise<FormattedAccountOrder[]> {
  // 1. Validate
  validate.getOrders({address, options})
  // 2. Make Request
  const responses = await this._requestAll('account_offers', {
    account: address,
    ledger_index: options.ledgerVersion || (await this.getLedgerVersion()),
    limit: options.limit
  })
  // 3. Return Formatted Response, from the perspective of `address`
  return formatResponse(address, responses)
}
