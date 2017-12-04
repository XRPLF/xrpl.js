/* @flow */

import {parseTimestamp} from './utils'
import {removeUndefined, dropsToXrp} from '../../common'

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
  return removeUndefined({
    account: data.Account,
    amount: dropsToXrp(data.Amount),
    balance: dropsToXrp(data.Balance),
    destination: data.Destination,
    publicKey: data.PublicKey,
    settleDelay: data.SettleDelay,
    expiration: parseTimestamp(data.Expiration),
    cancelAfter: parseTimestamp(data.CancelAfter),
    sourceTag: data.SourceTag,
    destinationTag: data.DestinationTag,
    previousAffectingTransactionID: data.PreviousTxnID,
    previousAffectingTransactionLedgerVersion: data.PreviousTxnLgrSeq
  })
}

export default parsePaymentChannel
