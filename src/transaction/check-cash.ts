import * as utils from './utils'
const ValidationError = utils.common.errors.ValidationError
const toRippledAmount = utils.common.toRippledAmount
import {validate} from '../common'
import {Instructions, Prepare, TransactionJSON} from './types'
import {Amount} from '../common/types/objects'
import {RippleAPI} from '..'

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

  if (checkCash.amount !== undefined) {
    txJSON.Amount = toRippledAmount(checkCash.amount)
  }

  if (checkCash.deliverMin !== undefined) {
    txJSON.DeliverMin = toRippledAmount(checkCash.deliverMin)
  }

  return txJSON
}

function prepareCheckCash(
  this: RippleAPI,
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
