import * as utils from './utils'
import {validate, ensureClassicAddress} from '../common'
import {Connection} from '../client'
import {GetTrustlinesOptions} from './trustlines'
import {FormattedTrustline} from '../common/types/objects/trustlines'
import {Client} from '..'

export type Balance = {
  value: string
  currency: string
  counterparty?: string
}

export type GetBalances = Array<Balance>

function getTrustlineBalanceAmount(trustline: FormattedTrustline): Balance {
  return {
    currency: trustline.specification.currency,
    counterparty: trustline.specification.counterparty,
    value: trustline.state.balance
  }
}

function formatBalances(options: GetTrustlinesOptions, balances: {xrp: string, trustlines: FormattedTrustline[]}) {
  const result = balances.trustlines.map(getTrustlineBalanceAmount)
  if (
    !(options.counterparty || (options.currency && options.currency !== 'XRP'))
  ) {
    const xrpBalance = {
      currency: 'XRP',
      value: balances.xrp
    }
    result.unshift(xrpBalance)
  }
  if (options.limit && result.length > options.limit) {
    const toRemove = result.length - options.limit
    result.splice(-toRemove, toRemove)
  }
  return result
}

function getLedgerVersionHelper(
  connection: Connection,
  optionValue?: number
): Promise<number> {
  if (optionValue != null && optionValue !== null) {
    return Promise.resolve(optionValue)
  }
  return connection.getLedgerVersion()
}

function getBalances(
  this: Client,
  address: string,
  options: GetTrustlinesOptions = {}
): Promise<GetBalances> {
  validate.getTrustlines({address, options})

  // Only support retrieving balances without a tag,
  // since we currently do not calculate balances
  // on a per-tag basis. Apps must interpret and
  // use tags independent of the XRP Ledger, comparing
  // with the XRP Ledger's balance as an accounting check.
  address = ensureClassicAddress(address)

  return Promise.all([
    getLedgerVersionHelper(
      this.connection,
      options.ledgerVersion
    ).then((ledgerVersion) =>
      utils.getXRPBalance(this.connection, address, ledgerVersion)
    ),
    this.getTrustlines(address, options)
  ]).then((results) =>
    formatBalances(options, {xrp: results[0], trustlines: results[1]})
  )
}

export default getBalances
