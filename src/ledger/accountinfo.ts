import {
  validate,
  ensureClassicAddress
} from '../common'
import {Client} from '..'
import { AccountInfoResponse } from '../models/methods'

export type GetAccountInfoOptions = {
  ledgerVersion?: number
}

export default async function getAccountInfo(
  this: Client,
  address: string,
  options: GetAccountInfoOptions = {}
): Promise<AccountInfoResponse> {
  // 1. Validate
  validate.getAccountInfo({address, options})

  // Only support retrieving account info without a tag,
  // since account info is not distinguished by tag.
  address = ensureClassicAddress(address)

  // 2. Make Request
  return await this.request({command: 'account_info',
    account: address,
    ledger_index: options.ledgerVersion || 'validated'
  })
}
