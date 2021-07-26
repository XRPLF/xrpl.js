import * as assert from 'assert'
import {parseTimestamp,parseMemos} from './utils'
import {removeUndefined} from '../../common'
import parseAmount from './amount'

function parsePaymentChannelCreate(tx: any): object {
  assert.ok(tx.TransactionType === 'PaymentChannelCreate')

  return removeUndefined({
    memos: parseMemos(tx),
    amount: parseAmount(tx.Amount).value,
    destination: tx.Destination,
    settleDelay: tx.SettleDelay,
    publicKey: tx.PublicKey,
    cancelAfter: tx.CancelAfter && parseTimestamp(tx.CancelAfter),
    sourceTag: tx.SourceTag,
    destinationTag: tx.DestinationTag
  })
}

export default parsePaymentChannelCreate
