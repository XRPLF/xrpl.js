/* @flow */
'use strict' // eslint-disable-line strict
const utils = require('./utils')

type PaymentChannelResponse = {
  account: string,
  balance: string,
  publicKey: number,
  destination: string,
  settleDelay: number,
  expiration?: number,
  cancelAfter?: number,
  sourceTag?: number,
  destinationTag?: number,
  previousAffectingTransactionID: string,
  previousAffectingTransactionLedgerVersion: number
}

function parsePaymentChannel(data: Object): PaymentChannelResponse {
  return utils.removeUndefined({
    account: data.Account,
    amount: utils.dropsToXrp(data.Amount),
    balance: utils.dropsToXrp(data.Balance),
    destination: data.Destination,
    publicKey: data.PublicKey,
    settleDelay: data.SettleDelay,
    expiration: utils.parseTimestamp(data.Expiration),
    cancelAfter: utils.parseTimestamp(data.CancelAfter),
    sourceTag: data.SourceTag,
    destinationTag: data.DestinationTag,
    previousAffectingTransactionID: data.PreviousTxnID,
    previousAffectingTransactionLedgerVersion: data.PreviousTxnLgrSeq
  })
}

module.exports = parsePaymentChannel
