import * as assert from 'assert'

import { parseMemos } from './utils'

function parseOrderCancellation(tx: any): object {
  assert.ok(tx.TransactionType === 'OfferCancel')
  return {
    memos: parseMemos(tx),
    orderSequence: tx.OfferSequence,
  }
}

export default parseOrderCancellation
