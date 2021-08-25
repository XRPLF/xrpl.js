import * as utils from './utils'
import {validate} from '../common'
import {ISOTimeToRippleTime, xrpToDrops} from '../utils'
import {Instructions, Prepare, TransactionJSON} from './types'
import {Client} from '..'

export type PaymentChannelFund = {
  channel: string
  amount: string
  expiration?: string
}

function createPaymentChannelFundTransaction(
  account: string,
  fund: PaymentChannelFund
): TransactionJSON {
  const txJSON: TransactionJSON = {
    Account: account,
    TransactionType: 'PaymentChannelFund',
    Channel: fund.channel,
    Amount: xrpToDrops(fund.amount)
  }

  if (fund.expiration != null) {
    txJSON.Expiration = ISOTimeToRippleTime(fund.expiration)
  }

  return txJSON
}

function preparePaymentChannelFund(
  this: Client,
  address: string,
  paymentChannelFund: PaymentChannelFund,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    validate.preparePaymentChannelFund({
      address,
      paymentChannelFund,
      instructions
    })
    const txJSON = createPaymentChannelFundTransaction(
      address,
      paymentChannelFund
    )
    return utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default preparePaymentChannelFund
