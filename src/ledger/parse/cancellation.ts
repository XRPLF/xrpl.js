import * as assert from 'assert'

function parseOrderCancellation(tx: any): object {
  assert.ok(tx.TransactionType === 'OfferCancel')
  return {
    orderSequence: tx.OfferSequence
  }
}

export default parseOrderCancellation
