import {Client} from '..'
import {
  GetAccountObjectsOptions
} from '../common/types/commands/account_objects'
import {AccountObjectsResponse} from '../models/methods'

export default async function getAccountObjects(
  this: Client,
  address: string,
  options: GetAccountObjectsOptions = {}
): Promise<AccountObjectsResponse> {
  // Don't validate the options so that new types can be passed
  // through to rippled. rippled validates requests.

  // Make Request
  const response = await this.request({
    command: 'account_objects',
    account: address,
    type: options.type,
    ledger_hash: options.ledgerHash,
    ledger_index: options.ledgerIndex,
    limit: options.limit,
    marker: options.marker
  })
  // Return Response
  return response
}
