import * as assert from 'assert'

import { txFlags } from '..'
import {
  FormattedOrderSpecification,
  OfferCreateTransaction,
} from '../../common/types/objects/index'
import { removeUndefined } from '../../utils'

import parseAmount from './amount'
import { parseTimestamp, parseMemos } from './utils'

const flags = txFlags.OfferCreate

function parseOrder(tx: OfferCreateTransaction): FormattedOrderSpecification {
  assert.ok(tx.TransactionType === 'OfferCreate')

  const direction = (tx.Flags & flags.Sell) === 0 ? 'buy' : 'sell'
  const takerGetsAmount = parseAmount(tx.TakerGets)
  const takerPaysAmount = parseAmount(tx.TakerPays)
  const quantity = direction === 'buy' ? takerPaysAmount : takerGetsAmount
  const totalPrice = direction === 'buy' ? takerGetsAmount : takerPaysAmount

  return removeUndefined({
    memos: parseMemos(tx),
    direction,
    quantity,
    totalPrice,
    passive: (tx.Flags & flags.Passive) !== 0 || undefined,
    immediateOrCancel: (tx.Flags & flags.ImmediateOrCancel) !== 0 || undefined,
    fillOrKill: (tx.Flags & flags.FillOrKill) !== 0 || undefined,
    expirationTime: parseTimestamp(tx.Expiration),
  })
}

export default parseOrder
