import * as _ from 'lodash'
import {validate} from '../common'
import {Amount} from '../common/types/objects'
import {ensureLedgerVersion} from './utils'
import {RippleAPI} from '..'

export type BalanceSheetOptions = {
  excludeAddresses?: Array<string>,
  ledgerVersion?: number
}

export type GetBalanceSheet = {
  balances?: Array<Amount>,
  assets?: Array<Amount>,
  obligations?: Array<{
     currency: string,
     value: string
   }>
}

function formatBalanceSheet(balanceSheet): GetBalanceSheet {
  const result: GetBalanceSheet = {}

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
    result.obligations = _.map(
      balanceSheet.obligations as {[key: string]: string},
      (value, currency) => ({currency, value})
    )
  }

  return result
}

async function getBalanceSheet(
  this: RippleAPI, address: string, options: BalanceSheetOptions = {}
): Promise<GetBalanceSheet> {
  // 1. Validate
  validate.getBalanceSheet({address, options})
  options = await ensureLedgerVersion.call(this, options)
  // 2. Make Request
  const response = await this.request('gateway_balances', {
    account: address,
    strict: true,
    hotwallet: options.excludeAddresses,
    ledger_index: options.ledgerVersion
  })
  // 3. Return Formatted Response
  return formatBalanceSheet(response)
}

export default getBalanceSheet
