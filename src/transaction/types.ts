import {
  FormattedOrderSpecification,
  FormattedTrustlineSpecification,
  Adjustment,
  RippledAmount,
  Memo,
  FormattedSettings
} from '../common/types/objects'
import {ApiMemo} from './utils'

export type TransactionJSON = {
  Account: string
  TransactionType: string
  Memos?: {Memo: ApiMemo}[]
  Flags?: number
  Fulfillment?: string
  [Field: string]: string | number | Array<any> | RippledAmount | undefined
}

export type Instructions = {
  sequence?: number
  ticketSequence?: number
  fee?: string
  // @deprecated
  maxFee?: string
  maxLedgerVersion?: number
  maxLedgerVersionOffset?: number
  signersCount?: number
}

export type Prepare = {
  txJSON: string
  instructions: {
    fee: string
    sequence?: number
    ticketSequence?: number
    maxLedgerVersion?: number
  }
}

export type Submit = {
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
  Memos?: {Memo: ApiMemo}[]
}

export interface SettingsTransaction extends TransactionJSON {
  TransferRate?: number
}

export type KeyPair = {
  publicKey: string
  privateKey: string
}

export type SignOptions = {
  signAs: string
}

export type Outcome = {
  result: string
  ledgerVersion: number
  indexInLedger: number
  fee: string
  balanceChanges: {
    [key: string]: {
      currency: string
      counterparty?: string
      value: string
    }[]
  }
  orderbookChanges: object
  deliveredAmount?: {
    currency: string
    counterparty?: string
    value: string
  }
  timestamp?: string
}

export type FormattedOrderCancellation = {
  orderSequence: number
}

export type FormattedPayment = {
  source: Adjustment
  destination: Adjustment
  paths?: string
  memos?: Array<Memo>
  invoiceID?: string
  allowPartialPayment?: boolean
  noDirectRipple?: boolean
  limitQuality?: boolean
}

export type FormattedPaymentTransaction = {
  type: string
  specification: FormattedPayment
  outcome: Outcome
  id: string
  address: string
  sequence: number
}

export type FormattedOrderTransaction = {
  type: string
  specification: FormattedOrderSpecification
  outcome: Outcome
  id: string
  address: string
  sequence: number
}

export type FormattedOrderCancellationTransaction = {
  type: string
  specification: FormattedOrderCancellation
  outcome: Outcome
  id: string
  address: string
  sequence: number
}

export type FormattedTrustlineTransaction = {
  type: string
  specification: FormattedTrustlineSpecification
  outcome: Outcome
  id: string
  address: string
  sequence: number
}

export type FormattedSettingsTransaction = {
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
