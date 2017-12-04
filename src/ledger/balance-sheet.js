/* @flow */

import * as _ from 'lodash'
import * as utils from './utils'
import {validate} from '../common'
import type {Amount} from '../common/types'

type BalanceSheetOptions = {
  excludeAddresses?: Array<string>,
  ledgerVersion?: number
}

type GetBalanceSheet = {
  balances?: Array<Amount>,
  assets?: Array<Amount>,
  obligations?: Array<{
     currency: string,
     value: string
   }>
}

function formatBalanceSheet(balanceSheet): GetBalanceSheet {
  const result = {}

  if (!_.isUndefined(balanceSheet.balances)) {
    result.balances = []
    _.forEach(balanceSheet.balances, (balances, counterparty) => {
      _.forEach(balances, balance => {
        result.balances.push(Object.assign({counterparty}, balance))
      })
    })
  }
  if (!_.isUndefined(balanceSheet.assets)) {
    result.assets = []
    _.forEach(balanceSheet.assets, (assets, counterparty) => {
      _.forEach(assets, balance => {
        result.assets.push(Object.assign({counterparty}, balance))
      })
    })
  }
  if (!_.isUndefined(balanceSheet.obligations)) {
    result.obligations = _.map(balanceSheet.obligations, (value, currency) =>
      ({currency, value}))
  }

  return result
}

function getBalanceSheet(address: string, options: BalanceSheetOptions = {}
): Promise<GetBalanceSheet> {
  validate.getBalanceSheet({address, options})

  return utils.ensureLedgerVersion.call(this, options).then(_options => {
    const request = {
      command: 'gateway_balances',
      account: address,
      strict: true,
      hotwallet: _options.excludeAddresses,
      ledger_index: _options.ledgerVersion
    }

    return this.connection.request(request).then(formatBalanceSheet)
  })
}

export default getBalanceSheet
