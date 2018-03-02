
import {Amount, Memo} from '../common/types/objects'

export type Outcome = {
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

export type Adjustment = {
  address: string,
  amount: {
   currency: string,
   counterparty?: string,
   value: string
 },
  tag?: number
}

export type Trustline = {
  currency: string,
  counterparty: string,
  limit: string,
  qualityIn?: number,
  qualityOut?: number,
  ripplingDisabled?: boolean,
  authorized?: boolean,
  frozen?: boolean
}

export type Settings = {
  passwordSpent?: boolean,
  requireDestinationTag?: boolean,
  requireAuthorization?: boolean,
  depositAuthorization?: boolean,
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

export type OrderCancellation = {
  orderSequence: number
}

export type Payment = {
  source: Adjustment,
  destination: Adjustment,
  paths?: string,
  memos?: Array<Memo>,
  invoiceID?: string,
  allowPartialPayment?: boolean,
  noDirectRipple?: boolean,
  limitQuality?: boolean
}

export type PaymentTransaction = {
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
  passive?: boolean,
  expirationTime?: string,
  orderToReplace?: number,
  memos?: Memo[]
}

export type OrderTransaction = {
  type: string,
  specification: Order,
  outcome: Outcome,
  id: string,
  address: string,
  sequence: number
}

export type OrderCancellationTransaction = {
  type: string,
  specification: OrderCancellation,
  outcome: Outcome,
  id: string,
  address: string,
  sequence: number
}

export type TrustlineTransaction = {
  type: string,
  specification: Trustline,
  outcome: Outcome,
  id: string,
  address: string,
  sequence: number
}

export type SettingsTransaction = {
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

export type TransactionResponse = TransactionType & {
  hash: string,
  ledger_index: number,
  meta: any,
  validated?: boolean
}
