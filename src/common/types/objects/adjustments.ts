import { Amount } from './amounts'

export interface Adjustment {
  address: string
  amount: Amount
  tag?: number
}

export interface MaxAdjustment {
  address: string
  maxAmount: Amount
  tag?: number
}

export interface MinAdjustment {
  address: string
  minAmount: Amount
  tag?: number
}
