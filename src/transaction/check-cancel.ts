import type { Client } from '..'
import autofill from '../ledger/autofill'
import { CheckCancel, Transaction } from '../models/transactions'

interface CheckCancelParameters {
  checkID: string
}

function createCheckCancelTransaction(
  account: string,
  cancel: CheckCancelParameters,
): CheckCancel {
  const transaction: CheckCancel = {
    Account: account,
    TransactionType: 'CheckCancel',
    CheckID: cancel.checkID,
  }

  return transaction
}

async function prepareCheckCancel(
  this: Client,
  address: string,
  checkCancel: CheckCancelParameters,
): Promise<Transaction> {
  try {
    const transaction = createCheckCancelTransaction(address, checkCancel)
    return await autofill(this, transaction)
  } catch (error) {
    return Promise.reject(error)
  }
}

export default prepareCheckCancel
