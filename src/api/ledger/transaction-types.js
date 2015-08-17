/* @flow */
'use strict';

type Outcome = {
  result: string,
  timestamp?: string,
  fee: string,
  balanceChanges: Object,
  orderbookChanges: Object,
  ledgerVersion: number,
  indexInLedger: number
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
  walletLocator?: string,
  walletSize?: number,
  messageKey?: string,
  domain?: string,
  transferRate?: number,
  signers?: string,
  regularKey?: string
}

type OrderCancellation = {
  orderSequence: number
}

type Memo = {
  type?: string,
  format?: string,
  data?: string
}

type Amount = {
  value: string,
  currency: string,
  counterparty?: string
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

type Order = {
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

export type GetTransactionResponse = PaymentTransaction | OrderTransaction |
  OrderCancellationTransaction | TrustlineTransaction | SettingsTransaction

export type GetTransactionResponseCallback =
  (err?: ?Error, data?: GetTransactionResponse) => void

export type CallbackType = (err?: ?Error, data?: Object) => void
