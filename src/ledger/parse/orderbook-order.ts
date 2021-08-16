import * as _ from 'lodash'
import {parseTimestamp, adjustQualityForXRP} from './utils'
import {removeUndefined} from '../../common'

import {orderFlags} from './flags'
import parseAmount from './amount'
import {BookOffer} from '../../common/types/commands'
import {Amount, FormattedOrderSpecification} from '../../common/types/objects'

export type FormattedOrderbookOrder = {
  specification: FormattedOrderSpecification
  properties: {
    maker: string
    sequence: number
    makerExchangeRate: string
  }
  state?: {
    fundedAmount: Amount
    priceOfFundedAmount: Amount
  }
  data: BookOffer
}

export function parseOrderbookOrder(data: BookOffer): FormattedOrderbookOrder {
  const direction = (data.Flags & orderFlags.Sell) === 0 ? 'buy' : 'sell'
  const takerGetsAmount = parseAmount(data.TakerGets)
  const takerPaysAmount = parseAmount(data.TakerPays)
  const quantity = direction === 'buy' ? takerPaysAmount : takerGetsAmount
  const totalPrice = direction === 'buy' ? takerGetsAmount : takerPaysAmount

  // note: immediateOrCancel and fillOrKill orders cannot enter the order book
  // so we can omit those flags here
  const specification: FormattedOrderSpecification = removeUndefined({
    direction: direction,
    quantity: quantity,
    totalPrice: totalPrice,
    passive: (data.Flags & orderFlags.Passive) !== 0 || undefined,
    expirationTime: parseTimestamp(data.Expiration)
  })

  const properties = {
    maker: data.Account,
    sequence: data.Sequence,
    makerExchangeRate: adjustQualityForXRP(
      data.quality,
      takerGetsAmount.currency,
      takerPaysAmount.currency
    )
  }

  const takerGetsFunded = data.taker_gets_funded
    ? parseAmount(data.taker_gets_funded)
    : undefined
  const takerPaysFunded = data.taker_pays_funded
    ? parseAmount(data.taker_pays_funded)
    : undefined
  const available = removeUndefined({
    fundedAmount: takerGetsFunded,
    priceOfFundedAmount: takerPaysFunded
  })
  const state = _.isEmpty(available) ? undefined : available
  return removeUndefined({specification, properties, state, data})
}
