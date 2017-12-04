/* @flow */

import parsePaymentChannel from './parse/payment-channel'
import {validate, errors} from '../common'
const NotFoundError = errors.NotFoundError

type PaymentChannel = {
  Sequence: number,
  Account: string,
  Balance: string,
  PublicKey: number,
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

type LedgerEntryResponse = {
  node: PaymentChannel,
  ledger_current_index?: number,
  ledger_hash?: string,
  ledger_index: number,
  validated: boolean
}

function formatResponse(response: LedgerEntryResponse) {
  if (response.node !== undefined &&
    response.node.LedgerEntryType === 'PayChannel') {
    return parsePaymentChannel(response.node)
  } else {
    throw new NotFoundError('Payment channel ledger entry not found')
  }
}

function getPaymentChannel(id: string): Promise<PaymentChannel> {
  validate.getPaymentChannel({id})

  const request = {
    command: 'ledger_entry',
    index: id,
    binary: false,
    ledger_index: 'validated'
  }

  return this.connection.request(request).then(formatResponse)
}

export default getPaymentChannel
