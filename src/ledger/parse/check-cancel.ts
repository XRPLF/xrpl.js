import * as assert from 'assert'
import {removeUndefined} from '../../common'

export type FormattedCheckCancel = {

  // ID of the Check ledger object to cancel.
  checkID: string
}

function parseCheckCancel(tx: any): FormattedCheckCancel {
  assert(tx.TransactionType === 'CheckCancel')

  return removeUndefined({
    checkID: tx.CheckID
  })
}

export default parseCheckCancel
