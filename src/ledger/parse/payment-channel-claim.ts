import * as assert from 'assert'

import { txFlags } from '../../common'
import { removeUndefined } from '../../utils'

import parseAmount from './amount'
import { parseMemos } from './utils'

const claimFlags = txFlags.PaymentChannelClaim

function parsePaymentChannelClaim(tx: any): object {
  assert.ok(tx.TransactionType === 'PaymentChannelClaim')

  return removeUndefined({
    memos: parseMemos(tx),
    channel: tx.Channel,
    balance: tx.Balance && parseAmount(tx.Balance).value,
    amount: tx.Amount && parseAmount(tx.Amount).value,
    signature: tx.Signature,
    publicKey: tx.PublicKey,
    renew: Boolean(tx.Flags & claimFlags.Renew) || undefined,
    close: Boolean(tx.Flags & claimFlags.Close) || undefined,
  })
}

export default parsePaymentChannelClaim
