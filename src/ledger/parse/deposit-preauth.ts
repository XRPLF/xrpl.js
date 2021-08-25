import * as assert from 'assert'
import {removeUndefined} from '../../utils'
import {parseMemos} from './utils'

export type FormattedDepositPreauth = {
  // account (address) of the sender to preauthorize
  authorize: string

  // account (address) of the sender whose preauthorization should be revoked
  unauthorize: string
}

function parseDepositPreauth(tx: any): FormattedDepositPreauth {
  assert.ok(tx.TransactionType === 'DepositPreauth')

  return removeUndefined({
    memos: parseMemos(tx),
    authorize: tx.Authorize,
    unauthorize: tx.Unauthorize
  })
}

export default parseDepositPreauth
