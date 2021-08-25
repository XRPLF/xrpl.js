import * as _ from 'lodash'
import {validate, ensureClassicAddress} from '../common'
import parseAccountTrustline from './parse/account-trustline'
import {Client} from '..'
// import {FormattedTrustline} from '../common/types/objects/trustlines'
import { AccountLinesRequest } from '../models/methods'

export type GetTrustlinesOptions = {
  issuer?: string
  currency?: string
  limit?: number
  ledgerVersion?: number
}

function currencyFilter(currency: string, trustline) {
  // return currency === null || trustline.specification.currency === currency
  return currency === null || trustline.currency === currency
}

async function getTrustlines(
  this: Client,
  address: string,
  options: GetTrustlinesOptions = {}
  ){
  // 1. Validate
  validate.getTrustlines({address, options})

  // 2. Make sure it is a classic address
  address = ensureClassicAddress(address)

  // 3. Get Account lines
  const request: AccountLinesRequest = {command: 'account_lines',
  account: address,
  ledger_index: options.ledgerVersion ?? 'validated',
  limit: options.limit,
  peer: options.issuer
}
  const responses = await this._requestAll(request)

  const trustlines = _.flatMap(responses, (response) => response.result.lines)
  console.log(JSON.stringify(trustlines))
  return trustlines.map(parseAccountTrustline).filter((trustline) => {
    return currencyFilter(options.currency || null, trustline)
  })
}

export default getTrustlines
