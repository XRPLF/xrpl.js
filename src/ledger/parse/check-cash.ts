import * as assert from 'assert'
import {removeUndefined} from '../../common'
import parseAmount from './amount'
import {Amount} from '../../common/types/objects'

export type FormattedCheckCash = {

  // ID of the Check ledger object to cash.
  checkID: string,

  // (Optional) redeem the Check for exactly this amount, if possible.
  // The currency must match that of the `SendMax` of the corresponding
  // `CheckCreate` transaction.
  amount: Amount,

  // (Optional) redeem the Check for at least this amount and
  // for as much as possible.
  // The currency must match that of the `SendMax` of the corresponding
  // `CheckCreate` transaction.
  deliverMin: Amount

  // *must* include either Amount or DeliverMin, but not both.
}

function parseCheckCash(tx: any): FormattedCheckCash {
  assert.ok(tx.TransactionType === 'CheckCash')

  return removeUndefined({
    checkID: tx.CheckID,
    amount: tx.Amount && parseAmount(tx.Amount),
    deliverMin: tx.DeliverMin && parseAmount(tx.DeliverMin)
  })
}

export default parseCheckCash
