import BigNumber from 'bignumber.js'
import parseAmount from './amount'
import {parseTimestamp, adjustQualityForXRP} from './utils'
import {removeUndefined} from '../../common'
import {orderFlags} from './flags'
import {Order} from '../types'

// TODO: remove this function once rippled provides quality directly
function computeQuality(takerGets, takerPays) {
  const quotient = new BigNumber(takerPays.value).dividedBy(takerGets.value)
  return quotient.toDigits(16, BigNumber.ROUND_HALF_UP).toString()
}

// rippled 'account_offers' returns a different format for orders than 'tx'
// the flags are also different
function parseAccountOrder(address: string, order: any): Order {
  const direction = (order.flags & orderFlags.Sell) === 0 ? 'buy' : 'sell'
  const takerGetsAmount = parseAmount(order.taker_gets)
  const takerPaysAmount = parseAmount(order.taker_pays)
  const quantity = (direction === 'buy') ? takerPaysAmount : takerGetsAmount
  const totalPrice = (direction === 'buy') ? takerGetsAmount : takerPaysAmount

  // note: immediateOrCancel and fillOrKill orders cannot enter the order book
  // so we can omit those flags here
  const specification = removeUndefined({
    direction: direction,
    quantity: quantity,
    totalPrice: totalPrice,
    passive: ((order.flags & orderFlags.Passive) !== 0) || undefined,
    // rippled currently does not provide "expiration" in account_offers
    expirationTime: parseTimestamp(order.expiration)
  })

  const makerExchangeRate = order.quality ?
    adjustQualityForXRP(order.quality.toString(),
      takerGetsAmount.currency, takerPaysAmount.currency) :
    computeQuality(takerGetsAmount, takerPaysAmount)
  const properties = {
    maker: address,
    sequence: order.seq,
    makerExchangeRate: makerExchangeRate
  }

  return {specification, properties}
}

export default parseAccountOrder
