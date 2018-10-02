import * as assert from 'assert'
import {parseTimestamp} from './utils'
import {removeUndefined} from '../../common'
import parseAmount from './amount'

function parsePaymentChannelFund(tx: any): object {
  assert(tx.TransactionType === 'PaymentChannelFund')

  return removeUndefined({
    channel: tx.Channel,
    amount: parseAmount(tx.Amount).value,
    expiration: tx.Expiration && parseTimestamp(tx.Expiration)
  })
}

export default parsePaymentChannelFund
