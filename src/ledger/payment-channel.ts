import parsePaymentChannel, {
  LedgerEntryResponse, PaymentChannel
} from './parse/payment-channel'
import {validate, errors} from '../common'
const NotFoundError = errors.NotFoundError

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
