import * as utils from './utils'
const validate = utils.common.validate
import {Instructions, Prepare, TransactionJSON} from './types'
import {RippleAPI} from '..'

function createOrderCancellationTransaction(account: string,
  orderCancellation: any
): TransactionJSON {
  const txJSON: any = {
    TransactionType: 'OfferCancel',
    Account: account,
    OfferSequence: orderCancellation.orderSequence
  }
  if (orderCancellation.memos !== undefined) {
    txJSON.Memos = orderCancellation.memos.map(utils.convertMemo)
  }
  return txJSON
}

function prepareOrderCancellation(this: RippleAPI, address: string, orderCancellation: object,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    validate.prepareOrderCancellation({address, orderCancellation, instructions})
    const txJSON = createOrderCancellationTransaction(address, orderCancellation)
    return utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default prepareOrderCancellation
