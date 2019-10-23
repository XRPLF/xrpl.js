import * as utils from './utils'
import {validate, iso8601ToRippleTime, xrpToDrops} from '../common'
import {Instructions, Prepare} from './types'
import {RippleAPI} from '..'

export type PaymentChannelFund = {
  channel: string,
  amount: string,
  expiration?: string
}

function createPaymentChannelFundTransaction(account: string,
  fund: PaymentChannelFund
): utils.TransactionJSON {
  const txJSON: utils.TransactionJSON = {
    Account: account,
    TransactionType: 'PaymentChannelFund',
    Channel: fund.channel,
    Amount: xrpToDrops(fund.amount)
  }

  if (fund.expiration !== undefined) {
    txJSON.Expiration = iso8601ToRippleTime(fund.expiration)
  }

  return txJSON
}

function preparePaymentChannelFund(this: RippleAPI, address: string,
  paymentChannelFund: PaymentChannelFund,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    validate.preparePaymentChannelFund(
      {address, paymentChannelFund, instructions})
    const txJSON = createPaymentChannelFundTransaction(
      address, paymentChannelFund)
    return utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default preparePaymentChannelFund
