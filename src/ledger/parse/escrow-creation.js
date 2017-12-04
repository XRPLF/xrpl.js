/* @flow */

import assert from 'assert'
import parseAmount from './amount'
import {parseTimestamp, parseMemos} from './utils'
import {removeUndefined} from '../../common'

function parseEscrowCreation(tx: Object): Object {
  assert(tx.TransactionType === 'EscrowCreate')

  return removeUndefined({
    amount: parseAmount(tx.Amount).value,
    destination: tx.Destination,
    memos: parseMemos(tx),
    condition: tx.Condition,
    allowCancelAfter: parseTimestamp(tx.CancelAfter),
    allowExecuteAfter: parseTimestamp(tx.FinishAfter),
    sourceTag: tx.SourceTag,
    destinationTag: tx.DestinationTag
  })
}

export default parseEscrowCreation
