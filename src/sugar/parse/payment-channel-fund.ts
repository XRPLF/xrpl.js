import * as assert from 'assert'

import { removeUndefined } from '../../utils'

import parseAmount from './amount'
import { parseTimestamp, parseMemos } from './utils'

function parsePaymentChannelFund(tx: any): object {
  assert.ok(tx.TransactionType === 'PaymentChannelFund')

  return removeUndefined({
    memos: parseMemos(tx),
    channel: tx.Channel,
    amount: parseAmount(tx.Amount).value,
    expiration: tx.Expiration && parseTimestamp(tx.Expiration),
  })
}

export default parsePaymentChannelFund
