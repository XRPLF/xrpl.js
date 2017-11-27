
import {Amount} from '../common/types'

export type OrdersOptions = {
  limit?: number,
  ledgerVersion?: number
}

export type OrderSpecification = {
  direction: string,
  quantity: Amount,
  totalPrice: Amount,
  immediateOrCancel?: boolean,
  fillOrKill?: boolean,
  // If enabled, the offer will not consume offers that exactly match it, and
  // instead becomes an Offer node in the ledger. It will still consume offers
  // that cross it.
  passive?: boolean
}

export type Order = {
   specification: OrderSpecification,
   properties: {
    maker: string,
    sequence: number,
    makerExchangeRate: string
  }
}

export type GetLedger = {
  // TODO: properties in type don't match response object. Fix!
  // accepted: boolean,
  // closed: boolean,
  stateHash: string,
  closeTime: string,
  closeTimeResolution: number,
  closeFlags: number,
  ledgerHash: string,
  ledgerVersion: number,
  parentLedgerHash: string,
  parentCloseTime: string,
  totalDrops: string,
  transactionHash: string,
  transactions?: Array<Object>,
  rawTransactions?: string,
  transactionHashes?: Array<string>,
  rawState?: string,
  stateHashes?: Array<string>
}
