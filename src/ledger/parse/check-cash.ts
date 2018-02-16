import * as assert from 'assert'
import {removeUndefined} from '../../common'
import parseAmount from './amount'

function parseCheckCash(tx: any): Object {
  assert(tx.TransactionType === 'CheckCash')

  return removeUndefined({

    // ID of the Check ledger object to cash
    checkID: tx.CheckID,

    // (Optional) redeem the Check for exactly this amount, if possible
    amount: parseAmount(tx.Amount).value,

    // (Optional) redeem the Check for at least this amount and
    // for as much as possible
    deliverMin: parseAmount(tx.DeliverMin).value

    // *must* include either Amount or DeliverMin, but not both
  })
}

export default parseCheckCash
