import * as utils from './utils'
const validate = utils.common.validate
import {Instructions, Prepare, TransactionJSON} from './types'
import {Memo} from '../common/types/objects'
import {Client} from '..'

export type EscrowCancellation = {
  owner: string
  escrowSequence: number

  // TODO: This ripple-lib memo format should be deprecated in favor of rippled's format.
  // If necessary, expose a public method for converting between the two formats.
  memos?: Array<Memo>
}

function createEscrowCancellationTransaction(
  account: string,
  payment: EscrowCancellation
): TransactionJSON {
  const txJSON: any = {
    TransactionType: 'EscrowCancel',
    Account: account,
    Owner: payment.owner,
    OfferSequence: payment.escrowSequence
  }
  if (payment.memos != null) {
    txJSON.Memos = payment.memos.map(utils.convertMemo)
  }
  return txJSON
}

function prepareEscrowCancellation(
  this: Client,
  address: string,
  escrowCancellation: EscrowCancellation,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.prepareEscrowCancellation({
    address,
    escrowCancellation,
    instructions
  })
  const txJSON = createEscrowCancellationTransaction(
    address,
    escrowCancellation
  )
  return utils.prepareTransaction(txJSON, this, instructions)
}

export default prepareEscrowCancellation
