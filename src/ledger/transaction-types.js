/* @flow */
'use strict' // eslint-disable-line strict

import type {Amount, Memo} from '../common/types.js'

type Outcome = {
  result: string,
  ledgerVersion: number,
  indexInLedger: number,
  fee: string,
  balanceChanges: {
    [key: string]: [{
     currency: string,
     counterparty?: string,
     value: string
    }]
  },
  orderbookChanges: Object,
  timestamp?: string
}

type Adjustment = {
  address: string,
  amount: {
   currency: string,
   counterparty?: string,
   value: string
 },
  tag?: number
}

type Trustline = {
  currency: string,
  counterparty: string,
  limit: string,
  qualityIn?: number,
  qualityOut?: number,
  ripplingDisabled?: boolean,
  authorized?: boolean,
  frozen?: boolean
}

type Settings = {
  passwordSpent?: boolean,
  requireDestinationTag?: boolean,
  requireAuthorization?: boolean,
  disallowIncomingXRP?: boolean,
  disableMasterKey?: boolean,
  enableTransactionIDTracking?: boolean,
  noFreeze?: boolean,
  globalFreeze?: boolean,
  defaultRipple?: boolean,
  emailHash?: string,
  messageKey?: string,
  domain?: string,
  transferRate?: number,
  regularKey?: string
}

type OrderCancellation = {
  orderSequence: number
}

type Payment = {
  source: Adjustment,
  destination: Adjustment,
  paths?: string,
  memos?: Array<Memo>,
  invoiceID?: string,
  allowPartialPayment?: boolean,
  noDirectRipple?: boolean,
  limitQuality?: boolean
}

type PaymentTransaction = {
  type: string,
  specification: Payment,
  outcome: Outcome,
  id: string,
  address: string,
  sequence: number
}

export type Order = {
  direction: string,
  quantity: Amount,
  totalPrice: Amount,
  immediateOrCancel?: boolean,
  fillOrKill?: boolean,
  passive?: boolean
}

type OrderTransaction = {
  type: string,
  specification: Order,
  outcome: Outcome,
  id: string,
  address: string,
  sequence: number
}

type OrderCancellationTransaction = {
  type: string,
  specification: OrderCancellation,
  outcome: Outcome,
  id: string,
  address: string,
  sequence: number
}

type TrustlineTransaction = {
  type: string,
  specification: Trustline,
  outcome: Outcome,
  id: string,
  address: string,
  sequence: number
}

type SettingsTransaction = {
  type: string,
  specification: Settings,
  outcome: Outcome,
  id: string,
  address: string,
  sequence: number
}

export type TransactionOptions = {
  minLedgerVersion?: number,
  maxLedgerVersion?: number
}

export type TransactionType = PaymentTransaction | OrderTransaction |
  OrderCancellationTransaction | TrustlineTransaction | SettingsTransaction
