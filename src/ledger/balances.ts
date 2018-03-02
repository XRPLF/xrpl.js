import * as utils from './utils'
import {validate} from '../common'
import {Connection} from '../common'
import {GetTrustlinesOptions} from './trustlines'
import {FormattedTrustline} from '../common/types/objects/trustlines'


export type Balance = {
  value: string,
  currency: string,
  counterparty?: string
}

export type GetBalances = Array<Balance>

function getTrustlineBalanceAmount(trustline: FormattedTrustline) {
  return {
    currency: trustline.specification.currency,
    counterparty: trustline.specification.counterparty,
    value: trustline.state.balance
  }
}

function formatBalances(options, balances) {
  const result = balances.trustlines.map(getTrustlineBalanceAmount)
  if (!(options.counterparty ||
       (options.currency && options.currency !== 'XRP')
  )) {
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

function getLedgerVersionHelper(connection: Connection, optionValue?: number
): Promise<number> {
  if (optionValue !== undefined && optionValue !== null) {
    return Promise.resolve(optionValue)
  }
  return connection.getLedgerVersion()
}

function getBalances(address: string, options: GetTrustlinesOptions = {}
): Promise<GetBalances> {
  validate.getTrustlines({address, options})

  return Promise.all([
    getLedgerVersionHelper(this.connection, options.ledgerVersion).then(
      ledgerVersion =>
        utils.getXRPBalance(this.connection, address, ledgerVersion)),
    this.getTrustlines(address, options)
  ]).then(results =>
    formatBalances(options, {xrp: results[0], trustlines: results[1]}))
}

export default getBalances
