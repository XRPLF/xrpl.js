import * as utils from './utils'
import {validate} from '../common'
import {Instructions, Prepare} from './types'

type CheckCancel = {
  checkID: string
}

function createCheckCancelTransaction(account: string,
  cancel: CheckCancel
): object {
  const txJSON = {
    Account: account,
    TransactionType: 'CheckCancel',
    CheckID: cancel.checkID
  }

  return txJSON
}

function prepareCheckCancel(address: string,
  checkCancel: CheckCancel,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareCheckCancel(
    {address, checkCancel, instructions})
  const txJSON = createCheckCancelTransaction(
    address, checkCancel)
  return utils.prepareTransaction(txJSON, this, instructions)
}

export default prepareCheckCancel
