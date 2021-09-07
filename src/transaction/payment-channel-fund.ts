import type { Client } from '..'
import { ISOTimeToRippleTime, xrpToDrops } from '../utils'

import { Instructions, Prepare, TransactionJSON } from './types'
import * as utils from './utils'

export interface PaymentChannelFund {
  channel: string
  amount: string
  expiration?: string
}

function createPaymentChannelFundTransaction(
  account: string,
  fund: PaymentChannelFund,
): TransactionJSON {
  const txJSON: TransactionJSON = {
    Account: account,
    TransactionType: 'PaymentChannelFund',
    Channel: fund.channel,
    Amount: xrpToDrops(fund.amount),
  }

  if (fund.expiration != null) {
    txJSON.Expiration = ISOTimeToRippleTime(fund.expiration)
  }

  return txJSON
}

async function preparePaymentChannelFund(
  this: Client,
  address: string,
  paymentChannelFund: PaymentChannelFund,
  instructions: Instructions = {},
): Promise<Prepare> {
  try {
    const txJSON = createPaymentChannelFundTransaction(
      address,
      paymentChannelFund,
    )
    return await utils.prepareTransaction(txJSON, this, instructions)
  } catch (e) {
    return Promise.reject(e)
  }
}

export default preparePaymentChannelFund
