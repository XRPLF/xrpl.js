import * as _ from 'lodash'
import {validate} from '../common'
import {Amount} from '../common/types/objects'
import {ensureLedgerVersion} from './utils'
import {RippleAPI} from '..'

export type BalanceSheetOptions = {
  excludeAddresses?: Array<string>
  ledgerVersion?: number
}

export type GetBalanceSheet = {
  balances?: Array<Amount>
  assets?: Array<Amount>
  obligations?: Array<{
    currency: string
    value: string
  }>
}

type BalanceSheet = {
  account: string,
  assets?: Record<string, any>,
  balances?: Record<string, any>,
  obligations?: Record<string, string>,
  ledger_current_index?: number,
  validated?: boolean
}

function formatBalanceSheet(balanceSheet: BalanceSheet): GetBalanceSheet {
  const result: GetBalanceSheet = {}

  if (balanceSheet.balances !== undefined) {
    result.balances = []
    Object.entries(balanceSheet.balances).forEach(entry => {
      const [counterparty, balances] = entry;
      balances.forEach((balance) => {
        result.balances.push(Object.assign({counterparty}, balance))
      })
    })
  }
  if (balanceSheet.assets !== undefined) {
    result.assets = []
    Object.entries(balanceSheet.assets).forEach(([counterparty, assets]) => {
      assets.forEach((balance) => {
        result.assets.push(Object.assign({counterparty}, balance))
      })
    })
  }
  if (balanceSheet.obligations !== undefined) {
    result.obligations = _.map(
      balanceSheet.obligations as {[key: string]: string},
      (value, currency) => ({currency, value})
    )
  }

  return result
}

async function getBalanceSheet(
  this: RippleAPI,
  address: string,
  options: BalanceSheetOptions = {}
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
