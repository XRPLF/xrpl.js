import _ from 'lodash'

import type { Client } from '..'
import { ensureClassicAddress } from '../common'
import { FormattedTrustline } from '../common/types/objects'

import parseAccountTrustline from './parse/account-trustline'

export interface GetTrustlinesOptions {
  counterparty?: string
  currency?: string
  limit?: number
  ledgerVersion?: number
}

function currencyFilter(
  currency: string | null,
  trustline: FormattedTrustline,
) {
  return currency === null || trustline.specification.currency === currency
}

async function getTrustlines(
  this: Client,
  address: string,
  options: GetTrustlinesOptions = {},
): Promise<FormattedTrustline[]> {
  // Only support retrieving trustlines without a tag,
  // since it does not make sense to filter trustlines
  // by tag.
  address = ensureClassicAddress(address)

  // 2. Make Request
  const responses = await this.requestAll({
    command: 'account_lines',
    account: address,
    ledger_index: options.ledgerVersion ?? 'validated',
    limit: options.limit,
    peer: options.counterparty,
  })
  // 3. Return Formatted Response
  const trustlines = _.flatMap(responses, (response) => response.result.lines)
  return trustlines.map(parseAccountTrustline).filter((trustline) => {
    return currencyFilter(options.currency ?? null, trustline)
  })
}

export default getTrustlines
