import {Memo} from './memos'

export interface Trustline {
  account: string
  balance: string
  currency: string
  limit: string
  limit_peer: string
  quality_in: number
  quality_out: number
  no_ripple?: boolean
  no_ripple_peer?: boolean
  freeze?: boolean
  freeze_peer?: boolean
  authorized?: boolean
  peer_authorized?: boolean
}

export type FormattedTrustlineSpecification = {
  currency: string
  counterparty: string
  limit: string
  qualityIn?: number
  qualityOut?: number
  ripplingDisabled?: boolean
  authorized?: boolean
  frozen?: boolean
  memos?: Memo[]
}

export type FormattedTrustline = {
  specification: FormattedTrustlineSpecification
  counterparty: {
    limit: string
    ripplingDisabled?: boolean
    frozen?: boolean
    authorized?: boolean
  }
  state: {
    balance: string
  }
}
