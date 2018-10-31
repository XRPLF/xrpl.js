import * as assert from 'assert'
import {removeUndefined} from '../../common'

export type FormattedDepositPreauth = {
  // account (address) of the sender to preauthorize
  authorize: string,

  // account (address) of the sender whose preauthorization should be revoked
  unauthorize: string
}

function parseDepositPreauth(tx: any): FormattedDepositPreauth {
  assert(tx.TransactionType === 'DepositPreauth')

  return removeUndefined({
    authorize: tx.Authorize,
    unauthorize: tx.Unauthorize
  })
}

export default parseDepositPreauth
