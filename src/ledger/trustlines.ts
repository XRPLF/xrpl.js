import _ from 'lodash'
import {validate, ensureClassicAddress} from '../common'
import parseAccountTrustline from './parse/account-trustline'
import {Client} from '..'
import {validate, ensureClassicAddress} from '../common'
import {FormattedTrustline} from '../common/types/objects/trustlines'

import parseAccountTrustline from './parse/account-trustline'

export interface GetTrustlinesOptions {
  counterparty?: string
  currency?: string
  limit?: number
  ledgerVersion?: number
}

function currencyFilter(currency: string, trustline: FormattedTrustline) {
  return currency === null || trustline.specification.currency === currency
}

async function getTrustlines(
  this: Client,
  address: string,
  options: GetTrustlinesOptions = {}
): Promise<FormattedTrustline[]> {
  // 1. Validate
  validate.getTrustlines({address, options})

  // Only support retrieving trustlines without a tag,
  // since it does not make sense to filter trustlines
  // by tag.
  address = ensureClassicAddress(address)

  // 2. Make Request
  const responses = await this.requestAll({command: 'account_lines',
    account: address,
    ledger_index: options.ledgerVersion ?? 'validated',
    limit: options.limit,
    peer: options.counterparty
  })
  // 3. Return Formatted Response
  const trustlines = _.flatMap(responses, (response) => response.result.lines)
  return trustlines.map(parseAccountTrustline).filter((trustline) => {
    return currencyFilter(options.currency || null, trustline)
  })
}

export default getTrustlines
