import * as utils from './utils'
import {validate, iso8601ToRippleTime, xrpToDrops} from '../common'
import {Instructions, Prepare} from './types'

export type PaymentChannelCreate = {
  amount: string,
  destination: string,
  settleDelay: number,
  publicKey: string,
  cancelAfter?: string,
  sourceTag?: number,
  destinationTag?: number
}

function createPaymentChannelCreateTransaction(account: string,
  paymentChannel: PaymentChannelCreate
): object {
  const txJSON: any = {
    Account: account,
    TransactionType: 'PaymentChannelCreate',
    Amount: xrpToDrops(paymentChannel.amount),
    Destination: paymentChannel.destination,
    SettleDelay: paymentChannel.settleDelay,
    PublicKey: paymentChannel.publicKey.toUpperCase()
  }

  if (paymentChannel.cancelAfter !== undefined) {
    txJSON.CancelAfter = iso8601ToRippleTime(paymentChannel.cancelAfter)
  }
  if (paymentChannel.sourceTag !== undefined) {
    txJSON.SourceTag = paymentChannel.sourceTag
  }
  if (paymentChannel.destinationTag !== undefined) {
    txJSON.DestinationTag = paymentChannel.destinationTag
  }

  return txJSON
}

function preparePaymentChannelCreate(address: string,
  paymentChannelCreate: PaymentChannelCreate,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    validate.preparePaymentChannelCreate(
      {address, paymentChannelCreate, instructions})
    const txJSON = createPaymentChannelCreateTransaction(
      address, paymentChannelCreate)
    return utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default preparePaymentChannelCreate
