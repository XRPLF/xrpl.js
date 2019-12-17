import {Amount} from './amounts'

export type Adjustment = {
  address: string
  amount: Amount
  tag?: number
}

export type MaxAdjustment = {
  address: string
  maxAmount: Amount
  tag?: number
}

export type MinAdjustment = {
  address: string
  minAmount: Amount
  tag?: number
}
