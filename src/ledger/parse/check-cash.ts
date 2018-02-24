import * as assert from 'assert'
import {removeUndefined} from '../../common'
import parseAmount from './amount'

function parseCheckCash(tx: any): Object {
  assert(tx.TransactionType === 'CheckCash')

  return removeUndefined({

    // ID of the Check ledger object to cash.
    checkID: tx.CheckID,

    // (Optional) redeem the Check for exactly this amount, if possible.
    // The currency must match that of the `SendMax` of the corresponding
    // `CheckCreate` transaction.
    amount: tx.Amount && parseAmount(tx.Amount),

    // (Optional) redeem the Check for at least this amount and
    // for as much as possible.
    // The currency must match that of the `SendMax` of the corresponding
    // `CheckCreate` transaction.
    deliverMin: tx.DeliverMin && parseAmount(tx.DeliverMin)

    // *must* include either Amount or DeliverMin, but not both.
  })
}

export default parseCheckCash
