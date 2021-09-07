import {
  FormattedOrderSpecification,
  FormattedTrustlineSpecification,
  Adjustment,
  RippledAmount,
  Memo,
  FormattedSettings,
} from '../common/types/objects'

import { ApiMemo } from './utils'

export interface TransactionJSON {
  Account: string
  TransactionType: string
  Memos?: Array<{ Memo: ApiMemo }>
  Flags?: number
  Fulfillment?: string
  [Field: string]: string | number | any[] | RippledAmount | undefined
}

export interface Instructions {
  sequence?: number
  ticketSequence?: number
  fee?: string
  // @deprecated
  maxFee?: string
  maxLedgerVersion?: number
  maxLedgerVersionOffset?: number
  signersCount?: number
}

export interface Prepare {
  txJSON: string
  instructions: {
    fee: string
    sequence?: number
    ticketSequence?: number
    maxLedgerVersion?: number
  }
}

export interface Submit {
  success: boolean
  engineResult: string
  engineResultCode: number
  engineResultMessage?: string
  txBlob?: string
  txJson?: object
}

export interface OfferCreateTransaction extends TransactionJSON {
  TransactionType: 'OfferCreate'
  Account: string
  Fee: string
  Flags: number
  LastLedgerSequence: number
  Sequence: number
  TakerGets: RippledAmount
  TakerPays: RippledAmount
  Expiration?: number
  OfferSequence?: number
  Memos?: Array<{ Memo: ApiMemo }>
}

export interface SettingsTransaction extends TransactionJSON {
  TransferRate?: number
}

export interface KeyPair {
  publicKey: string
  privateKey: string
}

export interface SignOptions {
  signAs: string
}

export interface Outcome {
  result: string
  ledgerVersion: number
  indexInLedger: number
  fee: string
  balanceChanges: {
    [key: string]: Array<{
      currency: string
      counterparty?: string
      value: string
    }>
  }
  orderbookChanges: object
  deliveredAmount?: {
    currency: string
    counterparty?: string
    value: string
  }
  timestamp?: string
}

export interface FormattedOrderCancellation {
  orderSequence: number
}

export interface FormattedPayment {
  source: Adjustment
  destination: Adjustment
  paths?: string
  memos?: Memo[]
  invoiceID?: string
  allowPartialPayment?: boolean
  noDirectRipple?: boolean
  limitQuality?: boolean
}

export interface FormattedPaymentTransaction {
  type: string
  specification: FormattedPayment
  outcome: Outcome
  id: string
  address: string
  sequence: number
}

export interface FormattedOrderTransaction {
  type: string
  specification: FormattedOrderSpecification
  outcome: Outcome
  id: string
  address: string
  sequence: number
}

export interface FormattedOrderCancellationTransaction {
  type: string
  specification: FormattedOrderCancellation
  outcome: Outcome
  id: string
  address: string
  sequence: number
}

export interface FormattedTrustlineTransaction {
  type: string
  specification: FormattedTrustlineSpecification
  outcome: Outcome
  id: string
  address: string
  sequence: number
}

export interface FormattedSettingsTransaction {
  type: string
  specification: FormattedSettings
  outcome: Outcome
  id: string
  address: string
  sequence: number
}

export type FormattedTransactionType =
  | FormattedPaymentTransaction
  | FormattedOrderTransaction
  | FormattedOrderCancellationTransaction
  | FormattedTrustlineTransaction
  | FormattedSettingsTransaction
