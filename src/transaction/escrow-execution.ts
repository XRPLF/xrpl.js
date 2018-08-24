import * as _ from 'lodash'
import * as utils from './utils'
const validate = utils.common.validate
const ValidationError = utils.common.errors.ValidationError
import {Instructions, Prepare} from './types'
import {Memo} from '../common/types/objects'

export type EscrowExecution = {
  owner: string,
  escrowSequence: number,
  memos?: Array<Memo>,
  condition?: string,
  fulfillment?: string
}

function createEscrowExecutionTransaction(account: string,
  payment: EscrowExecution
): object {
  const txJSON: any = {
    TransactionType: 'EscrowFinish',
    Account: account,
    Owner: payment.owner,
    OfferSequence: payment.escrowSequence
  }

  if (Boolean(payment.condition) !== Boolean(payment.fulfillment)) {
    throw new ValidationError('"condition" and "fulfillment" fields on'
      + ' EscrowFinish must only be specified together.')
  }

  if (payment.condition !== undefined) {
    txJSON.Condition = payment.condition
  }
  if (payment.fulfillment !== undefined) {
    txJSON.Fulfillment = payment.fulfillment
  }
  if (payment.memos !== undefined) {
    txJSON.Memos = _.map(payment.memos, utils.convertMemo)
  }
  return txJSON
}

function prepareEscrowExecution(address: string,
  escrowExecution: EscrowExecution,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareEscrowExecution(
    {address, escrowExecution, instructions})
  const txJSON = createEscrowExecutionTransaction(
    address, escrowExecution)
  return utils.prepareTransaction(txJSON, this, instructions)
}

export default prepareEscrowExecution
