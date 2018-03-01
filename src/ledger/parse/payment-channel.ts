import {parseTimestamp} from './utils'
import {removeUndefined, dropsToXrp} from '../../common'


export type PaymentChannel = {
  Sequence: number,
  Account: string,
  Amount: string,
  Balance: string,
  PublicKey: string,
  Destination: string,
  SettleDelay: number,
  Expiration?: number,
  CancelAfter?: number,
  SourceTag?: number,
  DestinationTag?: number,
  OwnerNode: string,
  LedgerEntryType: string,
  PreviousTxnID: string,
  PreviousTxnLgrSeq: number,
  index: string
}

export type LedgerEntryResponse = {
  node: PaymentChannel,
  ledger_current_index?: number,
  ledger_hash?: string,
  ledger_index: number,
  validated: boolean
}

export type PaymentChannelResponse = {
  account: string,
  balance: string,
  publicKey: string,
  destination: string,
  settleDelay: number,
  expiration?: string,
  cancelAfter?: string,
  sourceTag?: number,
  destinationTag?: number,
  previousAffectingTransactionID: string,
  previousAffectingTransactionLedgerVersion: number
}

function parsePaymentChannel(data: PaymentChannel): PaymentChannelResponse {
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
