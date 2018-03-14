import {Amount} from './amounts'
import {Memo} from './memos'

export type FormattedOrderSpecification = {
  direction: string,
  quantity: Amount,
  totalPrice: Amount,
  immediateOrCancel?: boolean,
  fillOrKill?: boolean,
  expirationTime?: string,
  orderToReplace?: number,
  memos?: Memo[],
  // If enabled, the offer will not consume offers that exactly match it, and
  // instead becomes an Offer node in the ledger. It will still consume offers
  // that cross it.
  passive?: boolean
}
