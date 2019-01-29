import * as _ from 'lodash'
import * as utils from './utils'
const validate = utils.common.validate
import {Instructions, Prepare} from './types'

function createOrderCancellationTransaction(account: string,
  orderCancellation: any
): object {
  const txJSON: any = {
    TransactionType: 'OfferCancel',
    Account: account,
    OfferSequence: orderCancellation.orderSequence
  }
  if (orderCancellation.memos !== undefined) {
    txJSON.Memos = _.map(orderCancellation.memos, utils.convertMemo)
  }
  return txJSON
}

function prepareOrderCancellation(address: string, orderCancellation: object,
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
