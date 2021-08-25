import * as utils from './utils'
import {validate} from '../common'
import {Instructions, Prepare, TransactionJSON} from './types'
import {Amount} from '../common/types/objects'
import {Client} from '..'
import {toRippledAmount} from '../utils'
import {ValidationError} from '../common/errors'

export type CheckCashParameters = {
  checkID: string
  amount?: Amount
  deliverMin?: Amount
}

function createCheckCashTransaction(
  account: string,
  checkCash: CheckCashParameters
): TransactionJSON {
  if (checkCash.amount && checkCash.deliverMin) {
    throw new ValidationError(
      '"amount" and "deliverMin" properties on ' +
        'CheckCash are mutually exclusive'
    )
  }

  const txJSON: any = {
    Account: account,
    TransactionType: 'CheckCash',
    CheckID: checkCash.checkID
  }

  if (checkCash.amount != null) {
    txJSON.Amount = toRippledAmount(checkCash.amount)
  }

  if (checkCash.deliverMin != null) {
    txJSON.DeliverMin = toRippledAmount(checkCash.deliverMin)
  }

  return txJSON
}

function prepareCheckCash(
  this: Client,
  address: string,
  checkCash: CheckCashParameters,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    validate.prepareCheckCash({address, checkCash, instructions})
    const txJSON = createCheckCashTransaction(address, checkCash)
    return utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default prepareCheckCash
