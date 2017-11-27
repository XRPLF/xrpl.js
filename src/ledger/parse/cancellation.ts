import * as assert from 'assert'

function parseOrderCancellation(tx: any): Object {
  assert(tx.TransactionType === 'OfferCancel')
  return {
    orderSequence: tx.OfferSequence
  }
}

export default parseOrderCancellation
