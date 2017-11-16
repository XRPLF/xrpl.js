/* @flow */
'use strict' // eslint-disable-line strict
const utils = require('./utils')
const {validate, iso8601ToRippleTime, xrpToDrops} = utils.common
import type {Instructions, Prepare} from './types.js'

type PaymentChannelFund = {
  channel: string,
  amount: string,
  expiration?: string
}

function createPaymentChannelFundTransaction(account: string,
  fund: PaymentChannelFund
): Object {
  const txJSON: Object = {
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

function preparePaymentChannelFund(address: string,
  paymentChannelFund: PaymentChannelFund,
  instructions: Instructions = {}
): Promise<Prepare> {
  validate.preparePaymentChannelFund(
    {address, paymentChannelFund, instructions})
  const txJSON = createPaymentChannelFundTransaction(
    address, paymentChannelFund)
  return utils.prepareTransaction(txJSON, this, instructions)
}

module.exports = preparePaymentChannelFund
