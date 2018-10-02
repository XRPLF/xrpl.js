import * as _ from 'lodash'
import * as utils from './utils'
import {validate, iso8601ToRippleTime, xrpToDrops} from '../common'
const ValidationError = utils.common.errors.ValidationError
import {Instructions, Prepare} from './types'
import {Memo} from '../common/types/objects'

export type EscrowCreation = {
  amount: string,
  destination: string,
  memos?: Array<Memo>,
  condition?: string,
  allowCancelAfter?: string,
  allowExecuteAfter?: string,
  sourceTag?: number,
  destinationTag?: number
}

function createEscrowCreationTransaction(account: string,
  payment: EscrowCreation
): object {
  const txJSON: any = {
    TransactionType: 'EscrowCreate',
    Account: account,
    Destination: payment.destination,
    Amount: xrpToDrops(payment.amount)
  }

  if (payment.condition !== undefined) {
    txJSON.Condition = payment.condition
  }
  if (payment.allowCancelAfter !== undefined) {
    txJSON.CancelAfter = iso8601ToRippleTime(payment.allowCancelAfter)
  }
  if (payment.allowExecuteAfter !== undefined) {
    txJSON.FinishAfter = iso8601ToRippleTime(payment.allowExecuteAfter)
  }
  if (payment.sourceTag !== undefined) {
    txJSON.SourceTag = payment.sourceTag
  }
  if (payment.destinationTag !== undefined) {
    txJSON.DestinationTag = payment.destinationTag
  }
  if (payment.memos !== undefined) {
    txJSON.Memos = _.map(payment.memos, utils.convertMemo)
  }
  if (Boolean(payment.allowCancelAfter) && Boolean(payment.allowExecuteAfter) &&
      txJSON.CancelAfter <= txJSON.FinishAfter) {
    throw new ValidationError('prepareEscrowCreation: ' +
      '"allowCancelAfter" must be after "allowExecuteAfter"')
  }
  return txJSON
}

function prepareEscrowCreation(address: string,
  escrowCreation: EscrowCreation,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareEscrowCreation(
    {address, escrowCreation, instructions})
  const txJSON = createEscrowCreationTransaction(
    address, escrowCreation)
  return utils.prepareTransaction(txJSON, this, instructions)
}

export default prepareEscrowCreation
