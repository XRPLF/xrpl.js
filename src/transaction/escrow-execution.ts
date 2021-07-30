import * as utils from './utils'
const validate = utils.common.validate
const ValidationError = utils.common.errors.ValidationError
import {Instructions, Prepare, TransactionJSON} from './types'
import {Memo} from '../common/types/objects'
import {RippleAPI} from '..'

export type EscrowExecution = {
  owner: string
  escrowSequence: number
  memos?: Array<Memo>
  condition?: string
  fulfillment?: string
}

function createEscrowExecutionTransaction(
  account: string,
  payment: EscrowExecution
): TransactionJSON {
  const txJSON: any = {
    TransactionType: 'EscrowFinish',
    Account: account,
    Owner: payment.owner,
    OfferSequence: payment.escrowSequence
  }

  if (Boolean(payment.condition) !== Boolean(payment.fulfillment)) {
    throw new ValidationError(
      '"condition" and "fulfillment" fields on' +
        ' EscrowFinish must only be specified together.'
    )
  }

  if (payment.condition != null) {
    txJSON.Condition = payment.condition
  }
  if (payment.fulfillment != null) {
    txJSON.Fulfillment = payment.fulfillment
  }
  if (payment.memos != null) {
    txJSON.Memos = payment.memos.map(utils.convertMemo)
  }
  return txJSON
}

function prepareEscrowExecution(
  this: RippleAPI,
  address: string,
  escrowExecution: EscrowExecution,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    validate.prepareEscrowExecution({address, escrowExecution, instructions})
    const txJSON = createEscrowExecutionTransaction(address, escrowExecution)
    return utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default prepareEscrowExecution
