import {parseTimestamp, parseMemos} from './utils'
import {removeUndefined, dropsToXrp} from '../../common'
import { PayChannel } from '../../models/ledger'

export type FormattedPaymentChannel = {
  account: string
  amount: string
  balance: string
  publicKey: string
  destination: string
  settleDelay: number
  expiration?: string
  cancelAfter?: string
  sourceTag?: number
  destinationTag?: number
  previousAffectingTransactionID: string
  previousAffectingTransactionLedgerVersion: number
}

export function parsePaymentChannel(
  data: PayChannel
): FormattedPaymentChannel {
  return removeUndefined({
    memos: parseMemos(data),
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
