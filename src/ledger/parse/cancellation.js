/* @flow */

import assert from 'assert'

function parseOrderCancellation(tx: Object): Object {
  assert(tx.TransactionType === 'OfferCancel')
  return {
    orderSequence: tx.OfferSequence
  }
}

export default parseOrderCancellation
