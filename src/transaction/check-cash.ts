import * as utils from './utils'
const ValidationError = utils.common.errors.ValidationError
const toRippledAmount = utils.common.toRippledAmount
import {validate} from '../common'
import {Instructions, Prepare} from './types'
import {Amount} from '../common/types/objects'

export type CheckCash = {
  checkID: string,
  amount?: Amount,
  deliverMin?: Amount
}

function createCheckCashTransaction(account: string,
  checkCash: CheckCash
): object {
  if (checkCash.amount && checkCash.deliverMin) {
    throw new ValidationError('"amount" and "deliverMin" properties on '
      + 'CheckCash are mutually exclusive')
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

function prepareCheckCash(address: string,
  checkCash: CheckCash,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareCheckCash(
    {address, checkCash, instructions})
  const txJSON = createCheckCashTransaction(
    address, checkCash)
  return utils.prepareTransaction(txJSON, this, instructions)
}

export default prepareCheckCash
