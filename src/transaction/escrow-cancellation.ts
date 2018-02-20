import * as _ from 'lodash'
import * as utils from './utils'
const validate = utils.common.validate
import {Instructions, Prepare} from './types'
import {Memo} from '../common/types/objects'

type EscrowCancellation = {
  owner: string,
  escrowSequence: number,
  memos?: Array<Memo>
}

function createEscrowCancellationTransaction(account: string,
  payment: EscrowCancellation
): Object {
  const txJSON: any = {
    TransactionType: 'EscrowCancel',
    Account: account,
    Owner: payment.owner,
    OfferSequence: payment.escrowSequence
  }
  if (payment.memos !== undefined) {
    txJSON.Memos = _.map(payment.memos, utils.convertMemo)
  }
  return txJSON
}

function prepareEscrowCancellation(address: string,
  escrowCancellation: EscrowCancellation,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareEscrowCancellation(
    {address, escrowCancellation, instructions})
  const txJSON = createEscrowCancellationTransaction(
    address, escrowCancellation)
  return utils.prepareTransaction(txJSON, this, instructions)
}

export default prepareEscrowCancellation
