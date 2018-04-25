import {
  parsePaymentChannel,
  FormattedPaymentChannel
} from './parse/payment-channel'
import {validate, errors} from '../common'
import {RippleAPI} from '../api'
import {LedgerEntryResponse} from '../common/types/commands'
const NotFoundError = errors.NotFoundError

function formatResponse(
  response: LedgerEntryResponse
): FormattedPaymentChannel {
  if (response.node === undefined ||
    response.node.LedgerEntryType !== 'PayChannel') {
    throw new NotFoundError('Payment channel ledger entry not found')
  }
  return parsePaymentChannel(response.node)
}

async function getPaymentChannel(
  this: RippleAPI, id: string
): Promise<FormattedPaymentChannel> {
  // 1. Validate
  validate.getPaymentChannel({id})
  // 2. Make Request
  const response = await this.request('ledger_entry', {
    index: id,
    binary: false,
    ledger_index: 'validated'
  })
  // 3. Return Formatted Response
  return formatResponse(response)
}

export default getPaymentChannel
