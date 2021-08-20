import {
  parsePaymentChannel,
  FormattedPaymentChannel
} from './parse/payment-channel'
import {validate, errors} from '../common'
import {Client} from '..'
import {LedgerEntryResponse} from '../models/methods'
const NotFoundError = errors.NotFoundError

function formatResponse(
  response: LedgerEntryResponse
): FormattedPaymentChannel {
  if (
    response.result.node == null ||
    response.result.node.LedgerEntryType !== 'PayChannel'
  ) {
    throw new NotFoundError('Payment channel ledger entry not found')
  }
  return parsePaymentChannel(response.result.node)
}

async function getPaymentChannel(
  this: Client,
  id: string
): Promise<FormattedPaymentChannel> {
  // 1. Validate
  validate.getPaymentChannel({id})
  // 2. Make Request
  const response = await this.request({command: 'ledger_entry',
    index: id,
    binary: false,
    ledger_index: 'validated'
  })
  // 3. Return Formatted Response
  return formatResponse(response)
}

export default getPaymentChannel
