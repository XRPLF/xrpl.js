import { Amount, RippledAmount } from '../../common/types/objects'
import { dropsToXrp } from '../../utils'

function parseAmount(amount: RippledAmount): Amount {
  if (typeof amount === 'string') {
    return {
      currency: 'XRP',
      value: dropsToXrp(amount),
    }
  }
  return {
    currency: amount.currency,
    value: amount.value,
    counterparty: amount.issuer,
  }
}

export default parseAmount
