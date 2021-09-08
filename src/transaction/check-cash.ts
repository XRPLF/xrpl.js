import type { Client } from '..'
import { ValidationError } from '../common/errors'
import { Amount } from '../common/types/objects'
import { CheckCash, Transaction } from '../models/transactions'
import { toRippledAmount } from '../utils'

interface CheckCashParameters {
  checkID: string
  amount?: Amount
  deliverMin?: Amount
}

function createCheckCashTransaction(
  account: string,
  checkCash: CheckCashParameters,
): Transaction {
  if (checkCash.amount && checkCash.deliverMin) {
    throw new ValidationError(
      '"amount" and "deliverMin" properties on ' +
        'CheckCash are mutually exclusive',
    )
  }

  const transaction: CheckCash = {
    Account: account,
    TransactionType: 'CheckCash',
    CheckID: checkCash.checkID,
  }

  if (checkCash.amount != null) {
    transaction.Amount = toRippledAmount(checkCash.amount)
  }

  if (checkCash.deliverMin != null) {
    transaction.DeliverMin = toRippledAmount(checkCash.deliverMin)
  }

  return transaction
}

async function prepareCheckCash(
  this: Client,
  address: string,
  checkCash: CheckCashParameters,
): Promise<Transaction> {
  try {
    const transaction = createCheckCashTransaction(address, checkCash)
    return await autofill(this, transaction)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default prepareCheckCash
