import * as assert from 'assert'
import {parseTimestamp,parseMemos} from './utils'
import {removeUndefined} from '../../common'
import parseAmount from './amount'

function parsePaymentChannelFund(tx: any): object {
  assert.ok(tx.TransactionType === 'PaymentChannelFund')

  return removeUndefined({
    memos: parseMemos(tx),
    channel: tx.Channel,
    amount: parseAmount(tx.Amount).value,
    expiration: tx.Expiration && parseTimestamp(tx.Expiration)
  })
}

export default parsePaymentChannelFund
