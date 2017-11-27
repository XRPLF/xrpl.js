import * as assert from 'assert'
import {parseMemos} from './utils'
import {removeUndefined} from '../../common'

function parseEscrowCancellation(tx: any): Object {
  assert(tx.TransactionType === 'EscrowCancel')

  return removeUndefined({
    memos: parseMemos(tx),
    owner: tx.Owner,
    escrowSequence: tx.OfferSequence
  })
}

export default parseEscrowCancellation
