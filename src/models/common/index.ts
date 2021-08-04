export type LedgerIndex = number | ('validated' | 'closed' | 'current')

export type AccountObjectType = 'check' | 'escrow' | 'offer' | 'payment_channel' | 'signer_list' | 'state'

export interface XRP {
  currency: "XRP"
}

export interface IssuedCurrency {
  currency: string
  issuer: string
}

export type Currency = IssuedCurrency | XRP

export interface IssuedCurrencyAmount extends IssuedCurrency {
  value: string
}

export type Amount = IssuedCurrencyAmount | string
