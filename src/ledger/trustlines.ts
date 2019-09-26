import * as _ from 'lodash'
import {validate} from '../common'
import parseAccountTrustline from './parse/account-trustline'
import {RippleAPI} from '..'
import {FormattedTrustline} from '../common/types/objects/trustlines'
import { xAddressToClassicAddress } from 'ripple-address-codec'

export type GetTrustlinesOptions = {
  counterparty?: string,
  currency?: string,
  limit?: number,
  ledgerVersion?: number
}

function currencyFilter(currency: string, trustline: FormattedTrustline) {
  return currency === null || trustline.specification.currency === currency
}

async function getTrustlines(
  this: RippleAPI, address: string, options: GetTrustlinesOptions = {}
): Promise<FormattedTrustline[]> {
  // 1. Validate
  validate.getTrustlines({address, options})

  // Only support retrieving trustlines without a tag,
  // since it does not make sense to filter trustlines
  // by tag.
  try {
    const {
      classicAddress,
      tag
    } = xAddressToClassicAddress(address)
    if (tag !== false) {
      return Promise.reject('getTrustlines does not support the use of a tag. Use an address without a tag.')
    }
    address = classicAddress
  } catch (_) {
    // `address` is already a classic address
  }

  // 2. Make Request
  const responses = await this._requestAll('account_lines', {
    account: address,
    ledger_index: await this.getLedgerVersion(),
    limit: options.limit,
    peer: options.counterparty
  })
  // 3. Return Formatted Response
  const trustlines = _.flatMap(responses, response => response.lines)
  return trustlines.map(parseAccountTrustline).filter(trustline => {
    return currencyFilter(options.currency || null, trustline)
  })
}

export default getTrustlines
