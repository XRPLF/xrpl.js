import {removeUndefined} from '../common'
import {RippleAPI} from '../api'
import {AccountObjectsResponse} from '../common/types/commands/account_objects'

export default async function getAccountObjects(
  this: RippleAPI, address: string, options: any = {}
): Promise<AccountObjectsResponse> {
  // Intentionally omit local validation.
  // Validation is performed by rippled.

  // Make Request
  const response = await this._request('account_objects', removeUndefined({
    account: address,
    type: options.type,
    ledger_hash: options.ledgerHash,
    ledger_index: options.ledgerIndex,
    limit: options.limit
  }))
  // Return Response
  return response
}
